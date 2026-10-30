# Savvy Admin

A clickable prototype of the Savvy admin dashboard: streams and their schedule, game modes with word sets and time slots, hosts, sponsors, polls, seasons, users and the shop. It runs entirely in the browser on a mock backend; sign in with any email and password.

**Live:** https://massliharf.github.io/savvy-admin/

```bash
npm install
npm run dev            # http://localhost:5173
npm run build:single   # one self-contained HTML file in dist-single/
```

Reset the sample data with `window.__resetMockDb()` in the browser console. Words in Game modes are hidden behind the prototype password `savvywords`.

All names, images and data are sample content.
