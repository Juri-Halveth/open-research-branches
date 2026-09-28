# Bounded local snapshot

This small PowerShell method records SHA-256 hashes for files under one explicitly selected local directory. The caller also selects a new output JSON path outside that directory. It makes no network request, does not execute discovered files, does not change input files, and refuses to overwrite an existing output.

```powershell
& ./scripts/collect-bounded-snapshot.ps1 -InputDirectory ./synthetic-input -OutputFile ./synthetic-snapshot.json -MaxFiles 100 -MaxFileBytes 67108864
& ./scripts/collect-bounded-snapshot.test.ps1
```

The test creates its own synthetic files under the operating system's temporary directory. For a real scan, keep the JSON **private**: relative filenames and hashes can reveal information about the chosen input even though the absolute root is omitted. Do not add generated snapshots to this public repository.

The script skips reparse points and records enumeration, read, observed mid-scan-change, and size-limit gaps. The default per-file size cap is 64 MiB. `truncated: true` means the file-count cap was reached before traversal ended. `HASHED_AT_SCAN_TIME` means the file was read at that moment; it does not mean the file or directory stayed unchanged later. A file can grow while being read, so the size check is not a strict I/O byte quota. A clear result does not prove all system files were covered, that external systems were reached, or that a file's owner, origin, rights, or meaning has been established.

**Claim ceiling:** `HASHED_FILES_AT_SCAN_TIME_WITHIN_DECLARED_COVERAGE_ONLY`. This is a local observation method, not a publication receipt or an authorization mechanism.

Code and test: [MIT](../LICENSE). This documentation: [CC BY 4.0](../LICENSE-CONTENT.md). The exact file-level exceptions are recorded in [LICENSES.md](../LICENSES.md).
