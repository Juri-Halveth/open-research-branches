import hashlib, json, unittest
from pathlib import Path
from unittest.mock import patch
import universe

class UniverseTests(unittest.TestCase):
    def test_four_outcomes_and_full_replay(self):
        result = universe.run_demo()
        self.assertEqual([row['outcome'] for row in result['results']],
                         ['MODEL_SUPPORTED', 'CONFLICT', 'OPEN', 'MODEL_OPPOSED'])
        for row in result['results']:
            raw = (universe.HERE / row['model']).read_bytes()
            self.assertTrue(universe.norm.verify(raw, row['record']))

    def test_archive_preserves_exact_result_bytes(self):
        result = universe.run_demo()
        events = result['fegefeuer']['ledger']
        for row in result['results']:
            expected = 'sha256:' + hashlib.sha256(universe.norm.canonical(row['record'])).hexdigest()
            self.assertEqual(row['archivedBytesDigest'], expected)
            self.assertEqual(next(e for e in events if e['event_id'] == row['eventId'])['event_binding'], row['eventBinding'])

    def test_hold_keeps_core_unchanged_and_candidate_present(self):
        fire = universe.run_demo()['fegefeuer']
        self.assertEqual(fire['coreBefore'], fire['coreAfter'])
        self.assertEqual(fire['coreSnapshot'], {})
        self.assertEqual(fire['archiveIds'], fire['pendingIds'])
        self.assertEqual(len(fire['archiveIds']), 4)
        self.assertEqual([r['operation'] for r in fire['ledger']], ['ARRIVED', 'HOLD_UNKNOWN'] * 4)

    def test_ledger_chain_binds_predecessor(self):
        records = universe.run_demo()['fegefeuer']['ledger']
        self.assertEqual(records[0]['previous'], 'NONE')
        for previous, current in zip(records, records[1:]):
            self.assertEqual(current['previous'], universe.fire.digest(universe.fire.pack(previous)))

    def test_repeated_runs_have_same_result_without_network(self):
        first = universe.run_demo()
        self.assertEqual(first, universe.run_demo())
        self.assertEqual(first['externalActions'], 0)
        self.assertEqual(first['authority'], 'MODEL_ONLY')

    def test_invalid_saved_record_stops_integration(self):
        with patch.object(universe.norm, 'verify', return_value=False):
            with self.assertRaisesRegex(ValueError, 'failed replay'):
                universe.run_demo()

    def test_catalog_matches_all_registered_branches(self):
        catalog = json.loads((universe.HERE / 'universe-catalog.json').read_text(encoding='utf-8'))
        registered = json.loads((universe.ROOT / 'catalog' / 'branches.json').read_text(encoding='utf-8'))['branches']
        self.assertEqual({r['id'] for r in catalog['branches']}, {r['id'] for r in registered})
        self.assertEqual(catalog['branchCount'], len(registered))
        for row in catalog['branches']:
            for file in row['sourceFiles'] + row['testFiles']:
                self.assertTrue((universe.ROOT / file).is_file())

    def test_twenty_four_blocks_have_unique_ids_and_existing_sources(self):
        blocks = json.loads((universe.HERE / 'blocks.json').read_text(encoding='utf-8'))
        self.assertEqual(blocks['count'], 24)
        self.assertEqual(len(blocks['blocks']), 24)
        self.assertEqual(len({b['id'] for b in blocks['blocks']}), 24)
        for block in blocks['blocks']:
            self.assertTrue((universe.HERE / block['implementation']).is_file())
            self.assertTrue((universe.HERE / block['testFile']).is_file())

if __name__ == '__main__':
    unittest.main()
