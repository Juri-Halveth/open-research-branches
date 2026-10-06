import json
import unittest
from dataclasses import replace
from fegefeuer_core import Event, Fegefeuer, Patch, MAX_RECORDS, digest, explore, pack, tree_bound


class FegefeuerTests(unittest.TestCase):
    def test_cumulative_bounds(self):
        self.assertEqual([tree_bound(d) for d in range(5)], [1, 26, 651, 16276, 406901])
        self.assertEqual(tree_bound(4, 1), 5)
        for invalid in [True, -1, 21, 2.0]:
            with self.assertRaises(ValueError): tree_bound(invalid)

    def test_occurrence_identity_keeps_equal_content_separate(self):
        f = Fegefeuer()
        a = Event("E1", b"signal", "SOURCE_A", "2026-10-06T17:11:00+02:00")
        b = Event("E2", b"signal", "SOURCE_B", "UNKNOWN")
        self.assertEqual(a.content_digest, b.content_digest)
        self.assertNotEqual(a.binding, b.binding)
        before = f.core_digest
        self.assertTrue(f.arrive(a)); self.assertTrue(f.arrive(b))
        self.assertEqual(f.core_digest, before)
        self.assertEqual(f.archive_ids, {"E1", "E2"})
        self.assertFalse(f.arrive(a))
        with self.assertRaises(ValueError): f.arrive(replace(a, source="SOURCE_C"))

    def test_invalid_domain(self):
        for value in [float("nan"), 1.0, {1: "key"}, (1, 2), object()]:
            with self.assertRaises(ValueError): pack(value)
        with self.assertRaises(ValueError): Event("id", b"raw", "source", context_json=b'{"z":1, "a":2}')
        with self.assertRaises(ValueError): Event("id", b"raw", "source", event_time="2026-10-06T17:11")
        with self.assertRaises(ValueError): Event("id", b"x" * 65537, "source")

    def test_batch_review_preserves_unreviewed_and_return_archive(self):
        f = Fegefeuer()
        for eid in ["A", "B", "C"]: f.arrive(Event(eid, eid.encode(), "sensor"))
        f.hold("A"); f.return_candidate("B")
        self.assertEqual(f.pending, {"A", "C"})
        self.assertEqual(f.archive_ids, {"A", "B", "C"})
        f.reopen("B"); self.assertEqual(f.pending, {"A", "B", "C"})

    def test_transform_patch_and_source_preservation(self):
        f = Fegefeuer(); event = Event("E", b"aBz\x00\xff", "sensor")
        f.arrive(event); before = f.core_digest; prefix = f.ledger
        p = f.propose("E"); self.assertEqual(p, f.propose("E"))
        body = json.loads(p.contract_json)
        self.assertEqual(body["byte_delta"], [{"offset": 0, "before": 97, "after": 65}, {"offset": 2, "before": 122, "after": 90}])
        self.assertFalse(f.commit(p, False)); self.assertEqual(f.core_digest, before)
        self.assertTrue(f.commit(p, True)); self.assertNotEqual(f.core_digest, before)
        self.assertEqual(event.raw, b"aBz\x00\xff"); self.assertEqual(f.ledger[:len(prefix)], prefix)
        self.assertEqual(f.core_snapshot()["E"], "QUJaAP8=")
        for previous, current in zip(f.ledger, f.ledger[1:]):
            self.assertEqual(json.loads(current)["previous"], digest(previous))
        with self.assertRaises(ValueError): f.commit(p, True)

    def test_stale_tampered_and_nonboolean_commits_fail(self):
        f = Fegefeuer()
        for eid in ["A", "B"]: f.arrive(Event(eid, b"a", "sensor"))
        a, b = f.propose("A"), f.propose("B")
        for flag in ["false", "true", 0, 1, None]:
            with self.assertRaises(ValueError): f.commit(a, flag)
        mutated = json.loads(a.contract_json); mutated["byte_delta"] = []
        with self.assertRaises(ValueError): f.commit(Patch(pack(mutated)), True)
        f.commit(a, True)
        with self.assertRaises(ValueError): f.commit(b, True)
        self.assertTrue(f.commit(f.propose("B"), True))

    def test_output_seed_is_new_occurrence_and_does_not_auto_commit(self):
        f = Fegefeuer(); f.arrive(Event("parent", b"abc", "sensor")); f.commit(f.propose("parent"), True)
        seed = f.output_seed("parent", "child")
        self.assertEqual(seed.raw, b"ABC")
        self.assertEqual(json.loads(seed.context_json)["parent_event_id"], "parent")
        before = f.core_digest; f.arrive(seed)
        self.assertEqual(f.core_digest, before); self.assertEqual(f.pending, {"child"})

    def test_cycles_and_multiple_provenance_edges(self):
        graph = {"A": ["B", "C"], "B": ["A", "C"], "C": ["A"]}
        result = explore(graph, "A", depth=4)
        self.assertEqual(result["nodes"], ["A", "B", "C"])
        self.assertEqual(len(result["entrances"]), 3)
        self.assertEqual(len(result["relations"]), 5)
        self.assertEqual(result["state"], "SELECTED_MODEL_CLOSURE")

    def test_unknown_empty_and_depth_limit_differ(self):
        self.assertEqual(explore({"A": []}, "A")["state"], "SELECTED_MODEL_CLOSURE")
        unknown = explore({}, "A"); self.assertEqual(unknown["unknown"], ["A"])
        self.assertEqual(unknown["state"], "FINITE_SNAPSHOT")
        limited = explore({"A": ["B"], "B": ["C"], "C": []}, "A", depth=1)
        self.assertEqual(limited["depth_boundary"], ["B"])
        self.assertEqual(limited["state"], "FINITE_SNAPSHOT")

    def test_aperture_and_node_budget_preserve_omissions(self):
        graph = {"A": [f"N{i:02d}" for i in range(26)]}
        graph.update({name: [] for name in graph["A"]})
        result = explore(graph, "A", depth=1)
        self.assertEqual(len(result["nodes"]), 26)
        self.assertEqual(result["deferred"][0]["node"], "N25")
        self.assertEqual(result["state"], "FINITE_SNAPSHOT")
        small = explore(graph, "A", depth=1, max_nodes=2)
        self.assertEqual(len(small["nodes"]), 2)
        self.assertTrue(any(d["reason"] == "NODE_BUDGET" for d in small["deferred"]))

    def test_regular_25_branch_tree(self):
        graph = {"ROOT": [f"L1_{i:02d}" for i in range(25)]}
        for parent in graph["ROOT"]:
            graph[parent] = [f"{parent}_L2_{j:02d}" for j in range(25)]
            for leaf in graph[parent]: graph[leaf] = []
        r = explore(graph, "ROOT", depth=2)
        self.assertEqual([len(level) for level in r["levels"]], [1, 25, 625])
        self.assertEqual(len(r["nodes"]), 651)
        self.assertEqual(r["state"], "SELECTED_MODEL_CLOSURE")

    def test_closure_idempotence_and_monotonicity_on_bound_graph(self):
        graph = {"A": ["B"], "B": ["C"], "C": []}
        def closure(seeds):
            return set().union(*(set(explore(graph, s, depth=4)["nodes"]) for s in seeds))
        a = {"B"}; b = {"A", "B"}
        self.assertTrue(a <= closure(a))
        self.assertTrue(closure(a) <= closure(b))
        self.assertEqual(closure(closure(b)), closure(b))

    def test_closed_frontier_retains_back_relation(self):
        r = explore({"A": ["B"], "B": ["A"]}, "A", depth=1)
        self.assertEqual(r["state"], "SELECTED_MODEL_CLOSURE")
        self.assertEqual({(e["source"], e["target"]) for e in r["relations"]}, {("A", "B"), ("B", "A")})

    def test_normalized_model_has_separate_source_digest(self):
        a = {"A": ["C", "B", "B"], "B": [], "C": []}
        b = {"A": ["B", "C"], "B": [], "C": []}
        ra, rb = explore(a, "A"), explore(b, "A")
        self.assertNotEqual(ra["source_digest"], rb["source_digest"])
        self.assertEqual(ra["model_digest"], rb["model_digest"])

    def test_receipt_limit_prevents_partial_commit(self):
        f = Fegefeuer(); f.arrive(Event("A", b"a", "sensor"))
        patch = f.propose("A")
        for _ in range(MAX_RECORDS-1): f.hold("A")
        before, queue = f.core_digest, f.pending
        with self.assertRaises(ValueError): f.commit(patch, True)
        self.assertEqual(f.core_digest, before)
        self.assertEqual(f.pending, queue)
        self.assertEqual(len(f.ledger), MAX_RECORDS)

    def test_strict_decrease_does_not_force_zero_or_finite_arrival(self):
        x = 2.0
        for _ in range(25):
            nxt = (x + 1) / 2
            self.assertLess(nxt, x); self.assertGreater(nxt, 1)
            x = nxt
        # Positive strict descent converges to 1, not 0.
        self.assertLess(abs(x-1), 0.000001)
        # Even contraction towards 0 need not reach 0 in finite steps.
        self.assertGreater(1 / 2**25, 0)

    def test_incoming_and_outgoing_are_distinct_bound_relations(self):
        graph = {"A": ["B"], "B": ["C"], "C": []}
        outgoing = explore(graph, "B", direction="OUTGOING")
        incoming = explore(graph, "B", direction="INCOMING")
        self.assertEqual(outgoing["nodes"], ["B", "C"])
        self.assertEqual(incoming["nodes"], ["A", "B"])
        relation = incoming["relations"][0]
        self.assertEqual((relation["source"], relation["target"]), ("B", "A"))
        self.assertEqual((relation["original_source"], relation["original_target"]), ("A", "B"))
        self.assertNotEqual(outgoing["model_digest"], incoming["model_digest"])
        with self.assertRaises(ValueError): explore(graph, "B", direction="SYMMETRIC_BY_GUESS")
        with self.assertRaises(ValueError): explore({"A": ["B"]}, "B", direction="INCOMING")


if __name__ == "__main__":
    unittest.main(verbosity=2)
