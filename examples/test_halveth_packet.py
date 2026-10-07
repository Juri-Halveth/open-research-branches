import base64,hashlib,importlib.util,json,pathlib,subprocess,unittest
ROOT=pathlib.Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('source_packet',ROOT/'examples/read-halveth-packet.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
class PacketTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.packet=json.loads(subprocess.check_output(['node',str(ROOT/'scripts/halveth-entry.mjs'),'indicate','F02'],cwd=ROOT))
    def test_real_node_packet_preserves_indication_and_source_binding(self):
        value=module.decode_packet(self.packet)
        self.assertEqual(value['sourceProofId'],'F02');self.assertEqual(value['state'],'INDICATED');self.assertEqual(value['externalEffects'],0)
    def test_changed_bytes_are_rejected(self):
        p=dict(self.packet);p['payloadSha256']='0'*64
        with self.assertRaises(ValueError):module.decode_packet(p)
    def test_duplicate_json_keys_do_not_silently_supersede(self):
        with self.assertRaises(ValueError):module.load('{"axis":1,"axis":2}')
    def test_whitespace_in_base64_is_not_a_silent_normalization(self):
        p=dict(self.packet);p['payloadBase64']+=' '
        with self.assertRaises(ValueError):module.decode_packet(p)
if __name__=='__main__':unittest.main()
