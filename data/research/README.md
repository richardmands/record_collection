# Photo audits

## 18 September 2026

Thirteen additional photographs (IMG_3241–IMG_3253) add 101 separately owned records, collection IDs 42–142. The owner confirmed that the repeated Fog Lamp, Umi ni Tsurete Itte and Cobalt Hour sleeves represent additional physical copies. These pairs retain separate IDs, source photographs and copy notes.

The batch uses 37 visually matched published covers (35 from label-supplied Apple Music artwork and two retailer images), plus 64 perspective-corrected reference crops. Published digital artwork identifies the cover design, not the exact vinyl pressing. All 101 crop coordinates are retained in cover-crops-2026-09-18.json; reproduce them with `python scripts/extract-reference-covers.py data/research/cover-crops-2026-09-18.json`. Original photos and unused fallback crops are retained for later review. The original 41 album entries and 448 track rows are preserved.

photo-audit-2026-09-18.json records sources and open questions per copy. Album years come from cited release histories or original-era digital catalogue dates; modern reissue dates were not used as vinyl years. Track lists, copy condition, purchase prices and unidentified catalogue numbers are left unfilled. Photo-only descriptions are labelled Collection notes. Records 64, 66, 67, 72, 80, 131 and 140 still need clearer back-cover or label evidence to establish their exact titles; 57 and 70 need performer credits. No performer was assigned from facial resemblance alone.

Corrections made during research include Kayama Yuzo Dori (75), Floating Music by Stomu Yamashta & Come to the Edge (76), Machiko Watanabe's Tooku Hanarete (98), Chiemi Hori's Best: Umareta Toki kara (104), Kei Ishiguro's Adlib (127), and Saori Minami's The Best / Again (134).

## 17 September 2026

The eleven originals in ../reference-photos are identification references. The owner subsequently authorised crops as artwork where clean matches remain unavailable. Position mappings and corrections are in photo-audit-2026-09-17.json; the workbook contains the resulting record and research notes.

Artwork provenance is listed in artwork-sources.json and in the workbook. Existing Discogs images were compared with the supplied sleeves. Record 16 uses the same album design from an earlier edition; the owned C28A0146 pressing is separately identified and its year is unknown. Eight new online front-cover matches replace missing or incorrect artwork. The prior front image for record 05 was actually the back cover.

The nine former placeholders now have artwork. Record 33 uses a clean matching cover from Columbia's official Osaka Shigure reissue page (original AX-7226, 1980-02-25). Records 03, 06, 13, 24, 34, 37, 39 and 40 use perspective-corrected reference crops, explicitly labelled in the site. Coordinates and extraction method are in cover-crops.json. Google Lens was tried for record 03 but no clean replacement was confirmed. Older unmatched artwork remains archived. The additional crop for 33 is retained but is not selected by the catalogue.

album-information.json records the new descriptions and artist links. Official album notes and exact Discogs listings take priority; rare or unidentified sleeves get explicitly labelled collection notes. Album history is kept separate from pressing uncertainty and copy condition. The Various Artists sampler has no individual artist biography link while its performers remain unidentified.

Significant corrections include Hibari Misora (not Harumi Miyako) for record 36 / AB-7001~2, Columbia (not Sony) for 41 / CL-22, and catalogue numbers on records 05, 12, 14, 16, 17, 20, 21, 23, 27, 33 and 39. Unknown or candidate numbers are not presented as confirmed facts. Shop stickers are not purchase records.

The original CSV and workbook track exports are retained as tracks-before-photo-audit.csv and .json respectively. The old CSV duplicated record 26, duplicated record 35, omitted workbook track lists for multiple later records, and contained an unconfirmed sampler list. The new catalogue starts from the workbook, corrects record 11 against Discogs 6410826, adds the 12-track R4J-7021 list from Discogs 15416408 and the two CL-22 sides from Discogs 13923247, and withdraws the wrongly copied list for record 36. Uncertain inherited lists remain flagged where known; front-sleeve checking alone is not a complete track-list audit.

A clearer sleeve/label view would help records 03, 06, 24, 37 and 40. Record 34 needs its exact pressing year and track list; record 36 needs its actual double-album track list. No record condition, shelf position or purchase price has been invented.
