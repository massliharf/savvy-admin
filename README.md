# Savvy Admin 2

A clickable prototype of the Savvy admin dashboard: streams and their schedule, bundles and word sets, How to play & format, time slots, hosts, sponsors, polls, seasons, users and the shop. It runs entirely in the browser on a mock backend; sign in with any email and password.

**Live:** https://massliharf.github.io/savvy-admin-2/ (version 1: https://massliharf.github.io/savvy-admin/)

```bash
npm install
npm run dev            # http://localhost:5173
npm run build:pages    # the GitHub Pages build in dist-pages/
```

Reset the sample data with `window.__resetMockDb()` in the browser console. Words in Bundles are hidden behind the prototype password `savvywords`.

All names, images and data are sample content.
