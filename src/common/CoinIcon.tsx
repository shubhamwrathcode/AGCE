import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet, StyleProp, ImageStyle, ViewStyle } from 'react-native';
import FastImage, { ImageStyle as FastImageStyle, ResizeMode, Source } from 'react-native-fast-image';
import { SvgXml } from 'react-native-svg';
import { buildCoinImageUri } from '../helper/coinIconUrl';
import { activities_icon } from '../helper/ImageAssets';

// In-memory cache for clean SVG XML strings
const svgXmlCache = new Map<string, string | null>();
// Set of URLs known to be raster images or failed
const rasterUrlCache = new Set<string>();
const failedUrlCache = new Set<string>();

const RASTER_REGEX = /\.(png|jpe?g|webp|gif|bmp)($|\?)/i;
const SVG_REGEX = /\.svg($|\?)/i;
const SVG_ROOT_REGEX = /^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i;

/**
 * Decide whether to fetch+inspect for SVG.
 * - `.svg` → yes
 * - `.png`/`.jpg`/… → no (FastImage)
 * - extensionless https (Fireblocks CDN ids) → yes (content-type may be image/svg+xml)
 */
function shouldProbeAsSvg(uri: string): boolean {
  if (!uri) return false;
  if (SVG_REGEX.test(uri)) return true;
  if (RASTER_REGEX.test(uri)) return false;
  return true;
}

async function checkAndFetchSvg(uri: string): Promise<string | null> {
  if (svgXmlCache.has(uri)) {
    return svgXmlCache.get(uri) || null;
  }
  if (rasterUrlCache.has(uri) || failedUrlCache.has(uri)) {
    return null;
  }
  try {
    const res = await fetch(uri);
    if (!res.ok) {
      svgXmlCache.set(uri, null);
      return null;
    }
    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    // Real raster — never treat as SVG (avoids false `<svg` match inside binary)
    if (/image\/(png|jpe?g|webp|gif|bmp|avif)/.test(contentType)) {
      rasterUrlCache.add(uri);
      svgXmlCache.set(uri, null);
      return null;
    }

    const text = await res.text();
    const looksSvg =
      contentType.includes('svg') ||
      ((contentType.includes('xml') || !contentType.startsWith('image/')) &&
        SVG_ROOT_REGEX.test(text));

    if (looksSvg) {
      const clean = text
        .replace(/^\uFEFF/, '')
        .replace(/<\?xml[^>]*\?>/gi, '')
        .replace(/<!DOCTYPE[^>]*>/gi, '')
        .trim();
      svgXmlCache.set(uri, clean);
      return clean;
    }

    rasterUrlCache.add(uri);
    svgXmlCache.set(uri, null);
    return null;
  } catch {
    svgXmlCache.set(uri, null);
    return null;
  }
}

interface CoinIconProps {
  coin?: any;
  uri?: string | null;
  style?: StyleProp<ImageStyle | FastImageStyle>;
  resizeMode?: ResizeMode;
  fallback?: Source | number;
  placeholderBg?: string;
}

export const CoinIcon: React.FC<CoinIconProps> = memo(({
  coin,
  uri: directUri,
  style,
  resizeMode = 'contain',
  fallback,
  placeholderBg,
}) => {
  const resolvedUri = directUri || (coin ? buildCoinImageUri(coin) : null);

  const probeSvg = Boolean(resolvedUri && shouldProbeAsSvg(resolvedUri));
  const isDirectRaster = Boolean(resolvedUri && !probeSvg);

  const [svgXml, setSvgXml] = useState<string | null>(() => {
    if (!resolvedUri || isDirectRaster) return null;
    return svgXmlCache.get(resolvedUri) || null;
  });
  const [hasError, setHasError] = useState<boolean>(false);
  const [probeDone, setProbeDone] = useState<boolean>(() => {
    if (!resolvedUri) return true;
    if (isDirectRaster) return true;
    return svgXmlCache.has(resolvedUri) || rasterUrlCache.has(resolvedUri);
  });

  useEffect(() => {
    let active = true;

    if (!resolvedUri) {
      setSvgXml(null);
      setHasError(false);
      setProbeDone(true);
      return;
    }

    // Allow retry after earlier FastImage failure on SVG CDNs (no .svg extension).
    if (probeSvg) {
      failedUrlCache.delete(resolvedUri);
      if (svgXmlCache.get(resolvedUri) === null && !rasterUrlCache.has(resolvedUri)) {
        svgXmlCache.delete(resolvedUri);
      }
      setHasError(false);
    }

    if (failedUrlCache.has(resolvedUri)) {
      setHasError(true);
      setProbeDone(true);
      return;
    }

    if (isDirectRaster) {
      setSvgXml(null);
      setHasError(false);
      setProbeDone(true);
      return;
    }

    if (svgXmlCache.has(resolvedUri)) {
      setSvgXml(svgXmlCache.get(resolvedUri) || null);
      setProbeDone(true);
      return;
    }

    if (rasterUrlCache.has(resolvedUri)) {
      setSvgXml(null);
      setProbeDone(true);
      return;
    }

    setProbeDone(false);
    checkAndFetchSvg(resolvedUri).then((clean) => {
      if (!active) return;
      setSvgXml(clean);
      setProbeDone(true);
    });

    return () => {
      active = false;
    };
  }, [resolvedUri, isDirectRaster, probeSvg]);

  const flatStyle = StyleSheet.flatten(style) || {};
  const width = (flatStyle.width as number) || 24;
  const height = (flatStyle.height as number) || 24;
  const borderRadius = (flatStyle.borderRadius as number) || 0;

  const effectiveFallback = fallback || activities_icon;

  if (!resolvedUri || hasError) {
    if (placeholderBg && !fallback) {
      return (
        <View
          style={[
            style as ViewStyle,
            { width, height, borderRadius, backgroundColor: placeholderBg },
          ]}
        />
      );
    }
    return (
      <FastImage
        source={effectiveFallback}
        style={style as StyleProp<FastImageStyle>}
        resizeMode={resizeMode}
      />
    );
  }

  if (svgXml) {
    return (
      <View
        style={[
          style as ViewStyle,
          {
            width,
            height,
            borderRadius,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000',
          },
        ]}
      >
        <SvgXml
          xml={svgXml}
          width="100%"
          height="100%"
          onError={() => {
            if (resolvedUri) failedUrlCache.add(resolvedUri);
            setHasError(true);
          }}
        />
      </View>
    );
  }

  // Still probing SVG vs raster — show fallback so rows never look empty
  if (probeSvg && !probeDone) {
    return (
      <FastImage
        source={effectiveFallback}
        style={style as StyleProp<FastImageStyle>}
        resizeMode={resizeMode}
      />
    );
  }

  return (
    <FastImage
      source={{ uri: resolvedUri }}
      style={style as StyleProp<FastImageStyle>}
      resizeMode={resizeMode}
      onError={() => {
        if (resolvedUri) failedUrlCache.add(resolvedUri);
        setHasError(true);
      }}
    />
  );
});

export default CoinIcon;
