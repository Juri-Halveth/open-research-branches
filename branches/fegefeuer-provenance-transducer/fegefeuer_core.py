"""FEGEFEUER 0.1: bounded local model; no network, loaders or external actions.

Closed JSON receipts bind declared data. They do not authenticate people,
establish external facts or grant authority over other systems.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from hashlib import sha256
import base64
import json
import re

VERSION = "fegefeuer-local-0.1"
OPERATOR = "ascii-upper-bytes-v1"
MAX_BYTES = 65536
MAX_EVENTS = 64
MAX_RECORDS = 512
ID = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.-]{0,79}\Z")


def canonical(value, depth=0):
    """Exact JSON domain: no floats, arbitrary objects or implicit coercion."""
    if depth > 32:
        raise ValueError("JSON depth exceeded")
    if value is None or type(value) in (bool, int, str):
        if type(value) is str:
            value.encode("utf-8", errors="strict")
        return value
    if type(value) is list:
        return [canonical(v, depth + 1) for v in value]
    if type(value) is dict and all(type(k) is str for k in value):
        return {k: canonical(v, depth + 1) for k, v in value.items()}
    raise ValueError("Value outside closed JSON domain")


def pack(value):
    return json.dumps(canonical(value), sort_keys=True, ensure_ascii=False,
                      allow_nan=False, separators=(",", ":")).encode("utf-8")


def digest(data):
    if type(data) is not bytes:
        raise TypeError("Digest input must be bytes")
    return "sha256:" + sha256(data).hexdigest()


def identifier(value):
    if type(value) is not str or not ID.fullmatch(value):
        raise ValueError("Invalid ASCII ID")
    return value


@dataclass(frozen=True)
class Event:
    event_id: str
    raw: bytes
    source: str
    event_time: str = "UNKNOWN"
    context_json: bytes = b"{}"

    def __post_init__(self):
        identifier(self.event_id)
        identifier(self.source)
        if type(self.raw) is not bytes or len(self.raw) > MAX_BYTES:
            raise ValueError("Raw bytes invalid or over limit")
        if type(self.context_json) is not bytes or len(self.context_json) > MAX_BYTES:
            raise ValueError("Context invalid or over limit")
        parsed = json.loads(self.context_json)
        if type(parsed) is not dict or pack(parsed) != self.context_json:
            raise ValueError("Context must be canonical JSON object bytes")
        if self.event_time != "UNKNOWN":
            if type(self.event_time) is not str:
                raise ValueError("Event time must be timezone-bound or UNKNOWN")
            timestamp = datetime.fromisoformat(self.event_time.replace("Z", "+00:00"))
            if timestamp.tzinfo is None:
                raise ValueError("Event time requires timezone")

    @property
    def content_digest(self):
        return digest(self.raw)

    @property
    def binding(self):
        return digest(pack({"event_id": self.event_id, "content": self.content_digest,
                            "source": self.source, "event_time": self.event_time,
                            "context": json.loads(self.context_json)}))


@dataclass(frozen=True)
class Patch:
    contract_json: bytes

    @property
    def binding(self):
        return digest(self.contract_json)


class Fegefeuer:
    """In-memory candidate queue, immutable raw event archive, separate core."""
    def __init__(self):
        self._archive = {}
        self._pending = set()
        self._returned = set()
        self._core = {}
        self._ledger = ()

    def core_snapshot(self):
        return {key: base64.b64encode(value).decode("ascii")
                for key, value in sorted(self._core.items())}

    @property
    def core_digest(self):
        return digest(pack(self.core_snapshot()))

    @property
    def pending(self):
        return frozenset(self._pending)

    @property
    def archive_ids(self):
        return frozenset(self._archive)

    @property
    def ledger(self):
        return self._ledger  # tuple of immutable canonical bytes

    def _record(self, operation, event_id, before, delta):
        self._ensure_ledger_capacity()
        record = {"record_id": f"R{len(self._ledger)+1:04d}",
                  "operation": operation, "event_id": event_id,
                  "event_binding": self._archive[event_id].binding,
                  "source_event_time": self._archive[event_id].event_time,
                  "timebase": "LOCAL_SEQUENCE_ONLY", "version": VERSION,
                  "previous": digest(self._ledger[-1]) if self._ledger else "NONE",
                  "core_before": before, "core_after": self.core_digest,
                  "delta": delta}
        self._ledger += (pack(record),)

    def _ensure_ledger_capacity(self):
        if len(self._ledger) >= MAX_RECORDS:
            raise ValueError("Receipt budget reached; explicit reentry required")

    def arrive(self, event):
        if type(event) is not Event:
            raise TypeError("Typed Event required")
        existing = self._archive.get(event.event_id)
        if existing is not None:
            if existing.binding != event.binding:
                raise ValueError("Existing event ID has conflicting provenance")
            return False  # exact same occurrence, no duplicate materialization
        if len(self._archive) >= MAX_EVENTS:
            raise ValueError("Event budget reached")
        self._ensure_ledger_capacity()
        before = self.core_digest
        self._archive[event.event_id] = event
        self._pending.add(event.event_id)
        self._record("ARRIVED", event.event_id, before, [])
        return True

    def hold(self, event_id):
        if event_id not in self._pending:
            raise ValueError("Candidate is not pending")
        self._record("HOLD_UNKNOWN", event_id, self.core_digest, [])

    def return_candidate(self, event_id):
        if event_id not in self._pending:
            raise ValueError("Candidate is not pending")
        self._ensure_ledger_capacity()
        before = self.core_digest
        self._pending.remove(event_id)
        self._returned.add(event_id)
        self._record("RETURNED_ARCHIVE_RETAINED", event_id, before, [])

    def reopen(self, event_id):
        if event_id not in self._returned:
            raise ValueError("Candidate is not in returned set")
        self._ensure_ledger_capacity()
        self._returned.remove(event_id)
        self._pending.add(event_id)
        self._record("REOPENED", event_id, self.core_digest, [])

    def propose(self, event_id):
        if event_id not in self._pending:
            raise ValueError("Candidate is not pending")
        event = self._archive[event_id]
        output = bytes(b - 32 if 97 <= b <= 122 else b for b in event.raw)
        differences = [{"offset": i, "before": a, "after": b}
                       for i, (a, b) in enumerate(zip(event.raw, output)) if a != b]
        return Patch(pack({"event_id": event_id, "event_binding": event.binding,
                           "operator": OPERATOR, "base": self.core_digest,
                           "input_digest": event.content_digest,
                           "output_digest": digest(output),
                           "output_base64": base64.b64encode(output).decode("ascii"),
                           "byte_delta": differences, "target": "LOCAL_MODEL_CORE"}))

    def commit(self, patch, local_allow):
        if type(local_allow) is not bool or type(patch) is not Patch:
            raise ValueError("Exact local boolean and typed Patch required")
        contract = json.loads(patch.contract_json)
        event_id = contract.get("event_id")
        expected = self.propose(event_id)
        if expected.contract_json != patch.contract_json:
            raise ValueError("Patch differs from deterministic source/base contract")
        self._ensure_ledger_capacity()
        if not local_allow:
            self.hold(event_id)
            return False
        before = self.core_digest
        output = base64.b64decode(contract["output_base64"], validate=True)
        self._core[event_id] = output
        self._pending.remove(event_id)
        self._record("MATERIALIZED_LOCAL_MODEL", event_id, before,
                     [{"added_core_id": event_id, "patch_binding": patch.binding,
                       "input_digest": contract["input_digest"],
                       "output_digest": contract["output_digest"],
                       "byte_delta": contract["byte_delta"]}])
        return True

    def output_seed(self, parent_id, new_id):
        if parent_id not in self._core:
            raise ValueError("Parent output is not materialized")
        return Event(new_id, self._core[parent_id], "MODEL_OUTPUT", "UNKNOWN",
                     pack({"parent_event_id": parent_id,
                           "parent_binding": self._archive[parent_id].binding,
                           "operator": OPERATOR, "relation": "OUTPUT_USED_AS_NEW_SEED"}))


def tree_bound(depth, branching=25):
    if type(depth) is not int or type(branching) is not int or not 0 <= depth <= 20 or not 1 <= branching <= 25:
        raise ValueError("Bounded integer depth and branching required")
    return sum(branching ** i for i in range(depth + 1))


def explore(adjacency, seed, *, depth=2, branching=25, max_nodes=5000, direction="OUTGOING"):
    """BFS over an explicitly supplied finite directed model snapshot.

    Missing adjacency means UNKNOWN; [] explicitly binds no supplied neighbours.
    A per-node sorted selection preserves omitted neighbours in a defer ledger.
    """
    identifier(seed)
    if direction not in ("OUTGOING", "INCOMING"):
        raise ValueError("Direction must be OUTGOING or INCOMING")
    if type(adjacency) is not dict or len(adjacency) > 10000:
        raise ValueError("Bounded adjacency dictionary required")
    if type(depth) is not int or not 0 <= depth <= 4:
        raise ValueError("Depth must be integer 0..4")
    if type(branching) is not int or not 1 <= branching <= 25:
        raise ValueError("Branching must be integer 1..25")
    if type(max_nodes) is not int or not 1 <= max_nodes <= 5000:
        raise ValueError("Node budget must be integer 1..5000")
    graph = {}
    edge_count = 0
    for key, values in adjacency.items():
        identifier(key)
        if type(values) is not list or len(values) > 1000:
            raise ValueError("Neighbour list invalid or over limit")
        edge_count += len(values)
        if edge_count > 50000:
            raise ValueError("Source edge budget reached")
        for v in values:
            identifier(v)
        graph[key] = sorted(set(values))
    source_digest = digest(pack(adjacency))
    if direction == "INCOMING":
        referenced = {seed} | {v for values in graph.values() for v in values}
        if not referenced <= graph.keys():
            raise ValueError("Incoming traversal requires all referenced nodes bound in supplied adjacency")
        reversed_graph = {v: [] for v in graph}
        for parent, children in graph.items():
            for child in children:
                reversed_graph[child].append(parent)
        graph = {v: sorted(values) for v, values in reversed_graph.items()}
    model_digest = digest(pack({"direction": direction, "adjacency": graph}))
    def relation(parent, child, level):
        return {"source": parent, "target": child,
                "type": "DECLARED_MODEL_TRAVERSAL_" + direction,
                "original_source": parent if direction == "OUTGOING" else child,
                "original_target": child if direction == "OUTGOING" else parent,
                "depth": level}
    seen, front = {seed}, {seed}
    levels = [[seed]]
    entrances = [{"node": seed, "parent": None, "depth": 0,
                  "basis": "DECLARED_SEED_NOT_CAUSELESS"}]
    relations, unknown, deferred, boundary = [], set(), [], set()
    expanded = set()
    for level in range(depth):
        new = set()
        for parent in sorted(front):
            expanded.add(parent)
            if parent not in graph:
                unknown.add(parent)
                continue
            candidates = graph[parent]
            selected = candidates[:branching]
            for child in candidates[branching:]:
                deferred.append({"parent": parent, "node": child,
                                 "reason": "PER_NODE_APERTURE", "reopen": "EXPAND_BOUND_APERTURE"})
            for child in selected:
                relations.append(relation(parent, child, level + 1))
                if child not in seen and child not in new:
                    if len(seen) + len(new) >= max_nodes:
                        deferred.append({"parent": parent, "node": child,
                                         "reason": "NODE_BUDGET", "reopen": "INCREASE_BOUND_BUDGET"})
                    else:
                        new.add(child)
                        entrances.append({"node": child, "parent": parent,
                                          "depth": level + 1, "basis": "DECLARED_MODEL_ADJACENCY"})
        seen |= new
        front = new
        levels.append(sorted(front))
        if not front:
            break
    # Exhaustion is asserted only for the selected static model relation.
    for node in front:
        if node not in graph:
            unknown.add(node)
        elif any(child not in seen for child in graph[node][:branching]):
            boundary.add(node)
        if node in graph:
            for child in graph[node][:branching]:
                if child in seen:
                    relations.append(relation(node, child, len(levels)))
        if node in graph and len(graph[node]) > branching:
            for child in graph[node][branching:]:
                deferred.append({"parent": node, "node": child,
                                 "reason": "PER_NODE_APERTURE", "reopen": "EXPAND_BOUND_APERTURE"})
    # A depth-zero or terminal frontier can already be closed in this supplied snapshot.
    for node in seen:
        if node not in graph:
            unknown.add(node)
    unresolved = bool(unknown or deferred or boundary)
    cursor = {"source_digest": source_digest, "model_digest": model_digest,
              "seed": seed, "direction": direction, "depth": depth, "branching": branching,
              "max_nodes": max_nodes, "frontier": sorted(front),
              "unknown": sorted(unknown), "deferred": deferred,
              "method": "REPLAY_FROM_SEED_ON_SAME_SOURCE_OR_DECLARE_NEW_SOURCE"}
    return {"version": VERSION, "source_digest": source_digest, "model_digest": model_digest,
            "direction": direction, "seed": seed,
            "nodes": sorted(seen), "levels": levels, "entrances": entrances,
            "relations": relations, "unknown": sorted(unknown),
            "deferred": deferred, "depth_boundary": sorted(boundary),
            "resume_cursor": cursor, "resume_cursor_digest": digest(pack(cursor)),
            "state": "FINITE_SNAPSHOT" if unresolved else "SELECTED_MODEL_CLOSURE",
            "claim_scope": "SUPPLIED_STATIC_MODEL_ONLY", "upper_bound": tree_bound(depth, branching)}
