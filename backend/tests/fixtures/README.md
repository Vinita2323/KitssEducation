# Generated video fixture

lesson-generated.mp4 contains 20 seconds of FFmpeg lavfi testsrc2 and sine output,
created for isolated tests, with no third-party course content or personal data.
320x180/24fps, H.264 Constrained Baseline/yuv420p, mono AAC-LC, fast-start MP4.
It is test content only and is never seeded into the configured application DB.

Generated using FFmpeg 9.0 with:
`ffmpeg -f lavfi -i testsrc2=size=320x180:rate=24 -f lavfi -i sine=frequency=440:sample_rate=44100 -t 20 -c:v libx264 -profile:v baseline -pix_fmt yuv420p -preset fast -crf 35 -c:a aac -ac 1 -movflags +faststart lesson-generated.mp4`
