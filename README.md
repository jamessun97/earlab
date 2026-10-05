# 聽感 EARLAB

Private Sites app with generated Web Audio exercises and per-account D1 progress.

`npm run db:generate` generates schema-only Drizzle migrations. `npm run build` packages the Worker and static shell. `npm run dev` runs a local Worker on port 4174; apply the generated migration locally before starting it. `npm test` verifies progress merging.

Hosted identity comes exclusively from the Sites dispatcher's authenticated-user headers. The app never accepts a user identifier in the progress payload. Sign-in and sign-out are dispatch-owned navigations. Browser service-worker caching excludes APIs and identity routes.

Progress uses an idempotent event journal and compare-and-swap database revisions. Each device's legacy snapshot is imported once. Same-slot daily answers advance the daily plan once while all actual attempts remain in cumulative statistics. Review mastery is replayed from events so stale devices cannot restore mastered questions. Account-specific local caches buffer offline activity; the D1 state is authoritative after reconciliation.

The browser must visit the online app once to install the offline shell. The account panel reports pending changes and offers a manual retry. Cloud sync starts automatically on page load, reconnect, and return to the page.

Mixing practice uses deterministic three-second synthesized drum, bass and harmony clips. A/B pairs share the same source. EQ and compression pairs use RMS matching; gain pairs preserve the specified dB ratio, and panning uses equal-power stereo. Mixing answers become available as soon as either A or B starts playing. Mixing categories persist through the same authenticated sync journal, including exact effect parameters in review IDs.
