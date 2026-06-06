#!/usr/bin/env swift
// macOS Dock: kare, opak 1024×1024 kaynak — squircle maskesini OS uygular.
// Şeffaf kenarlık YAPMAYIN (Dock gri “karton” gösterir).
// İsteğe bağlı: logo biraz büyütülür (fill, varsayılan ~0.92).

import AppKit

let args = CommandLine.arguments
guard args.count >= 3 else {
    fputs("Usage: macos-icon-pad.swift <input.png> <output.png> [fillRatio]\n", stderr)
    exit(1)
}

let inputPath = args[1]
let outputPath = args[2]
let canvas = 1024
var fillRatio = args.count > 3 ? (Double(args[3]) ?? 1.0) : 1.0

guard let source = NSImage(contentsOfFile: inputPath) else {
    fputs("Failed to load image: \(inputPath)\n", stderr)
    exit(1)
}

let srcSize = source.size
if args.count <= 3, Int(srcSize.width) == canvas, Int(srcSize.height) == canvas {
    fillRatio = 1.0
}
let drawSize = CGFloat(canvas) * CGFloat(fillRatio)

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
) else {
    fputs("Failed to allocate bitmap\n", stderr)
    exit(1)
}

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: bitmap)

// Opak arka plan: köşe pikselinden (genelde marka mavisi)
let bg: NSColor
if let rep = source.representations.first as? NSBitmapImageRep,
   let corner = rep.colorAt(x: 2, y: 2) {
    bg = corner
} else {
    bg = NSColor(red: 0.0, green: 0.114, blue: 0.286, alpha: 1) // termsh #001d49
}
bg.setFill()
NSBezierPath(rect: NSRect(x: 0, y: 0, width: canvas, height: canvas)).fill()

let scale = min(drawSize / srcSize.width, drawSize / srcSize.height)
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

guard let png = bitmap.representation(using: .png, properties: [:]) else {
    fputs("Failed to encode PNG\n", stderr)
    exit(1)
}

do {
    try png.write(to: URL(fileURLWithPath: outputPath))
} catch {
    fputs("Failed to write \(outputPath): \(error)\n", stderr)
    exit(1)
}
