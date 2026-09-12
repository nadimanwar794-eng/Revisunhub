import re
import os

pid = 616
maps_file = open(f"/proc/{pid}/maps", 'r')
mem_file = open(f"/proc/{pid}/mem", 'rb', 0)

with open('vite_mem.dump', 'wb') as f:
    for line in maps_file.readlines():
        m = re.match(r'([0-9A-Fa-f]+)-([0-9A-Fa-f]+) ([-r])', line)
        if m.group(3) == 'r':
            start = int(m.group(1), 16)
            end = int(m.group(2), 16)
            mem_file.seek(start)
            try:
                chunk = mem_file.read(end - start)
                f.write(chunk)
            except:
                pass
maps_file.close()
mem_file.close()
