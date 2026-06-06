#!/usr/bin/env swift
// Menü çubuğu template ikonları — glyph canvas'ın ~%94'ünü doldurur (daha büyük görünüm).
// macOS tray-icon crate görüntüyü 18pt yüksekliğe ölçekler; boşluk azaltmak için artwork büyütülür.

import AppKit

let args = CommandLine.arguments
guard args.count >= 2 else {
    fputs("Usage: build-tray-icons.swift <source.png> [output-dir]\n", stderr)
    exit(1)
}

let sourcePath = args[1]
let outDir = args.count > 2 ? args[2] : "src-tauri/icons"
let glyphFill: CGFloat = 0.94

let outputs: [(Int, String)] = [
    (18, "tray-icon.png"),
    (36, "tray-icon@2x.png"),
]

guard let source = NSImage(contentsOfFile: sourcePath) else {
    fputs("Failed to load: \(sourcePath)\n", stderr)
    exit(1)
}

func render(canvas: Int, source: NSImage) -> NSBitmapImageRep? {
    guard let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: canvas,
        pixelsHigh: canvas,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ) else { return nil }

    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

    NSColor.clear.set()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvas, height: canvas)).fill()

    let srcSize = source.size
    let side = CGFloat(canvas) * glyphFill
    let scale = min(side / srcSize.width, side / srcSize.height)
    let drawW = srcSize.width * scale
    let drawH = srcSize.height * scale
    let x = (CGFloat(canvas) - drawW) / 2
    let y = (CGFloat(canvas) - drawH) / 2

    source.draw(
        in: NSRect(x: x, y: y, width: drawW, height: drawH),
        from: NSRect(origin: .zero, size: srcSize),
        operation: .sourceOver,
        fraction: 1
    )

    NSGraphicsContext.restoreGraphicsState()
    return bitmap
}

for (size, name) in outputs {
    guard let bitmap = render(canvas: size, source: source) else {
        fputs("Failed to render \(name)\n", stderr)
        exit(1)
    }
    guard let data = bitmap.representation(using: .png, properties: [:]) else {
        fputs("Failed to encode \(name)\n", stderr)
        exit(1)
    }
    let outPath = (outDir as NSString).appendingPathComponent(name)
    do {
        try data.write(to: URL(fileURLWithPath: outPath))
        print("Wrote \(outPath) (\(size)×\(size))")
    } catch {
        fputs("Write failed \(outPath): \(error)\n", stderr)
        exit(1)
    }
}
