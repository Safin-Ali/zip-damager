# ZDamager ♻️

## Overview
ZDamager is a web-based tool designed to damage ZIP or OBB (Opaque Binary Blob) files, unrecoverable for extraction or unpacking while allowing archive viewer software to read their contents. This tool is developed specifically to repack ZIP or OBB files, for prevent their extraction or repacking.

### Features
- **Damage ZIP/OBB Files:** ZDamager can modify ZIP and OBB files to hinder their extraction or unpacking.
- **Compatibility:** The damaged archives remain readable by archive viewer software but cannot be unpacked or extracted.
- **Limitation:** Currently, the tool exclusively supports OBB files for damage.
- **Extracted Content Damage:** If forcely extract or unpack achive then the extracted content will be damage.

## Requirements
- **Clean achives. If your achives already `damaged` ZDamager cannot be repaired or repacked.**

## How to Use
1. **Upload:** Select the ZIP or OBB file you wish to damage.
2. **Click Damage File** Choose the file type you want to perform on the file (damage or repack).
3. **Output:** Automatic `Download` or `Save` the modified file for your specific use case.

### Important Notes
- Once a ZIP or OBB file has been damaged using ZDamager, it cannot be reverted to its original state.
- Repacking or repairing previously damaged files is currently not supported by this tool.
- Ensure to back up your original files before using ZDamager for modification.

## Limitations
- Currently, only `OBB` files are supported for damage. Support for other file formats may be considered in future updates.

### Disclaimer
Use this tool responsibly and only on files you have the right to modify. The developers are not responsible for any misuse or loss of data resulting from the use of ZDamager.
