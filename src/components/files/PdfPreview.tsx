import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  uri: string;
}

const BASE64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// Plain, dependency-free base64 encoder - deliberately not reaching
// for expo-file-system's File/Paths API here (see git history: an
// earlier attempt using it broke the whole app, not just this
// screen). fetch()/arrayBuffer() is the same mechanism already
// proven reliable for the text-file preview in files/[id].tsx.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let result = '';
  let i = 0;

  for (; i + 2 < bytes.length; i += 3) {
    result += BASE64_CHARS[bytes[i] >> 2];
    result += BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += BASE64_CHARS[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += BASE64_CHARS[bytes[i + 2] & 63];
  }

  const remaining = bytes.length - i;
  if (remaining === 1) {
    result += BASE64_CHARS[bytes[i] >> 2];
    result += BASE64_CHARS[(bytes[i] & 3) << 4];
    result += '==';
  } else if (remaining === 2) {
    result += BASE64_CHARS[bytes[i] >> 2];
    result += BASE64_CHARS[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += BASE64_CHARS[(bytes[i + 1] & 15) << 2];
    result += '=';
  }

  return result;
}

// react-native-pdf's own network-download path goes through
// react-native-blob-util, which strictly compares bytes received
// against the response's Content-Length header and reports "Download
// interrupted" on any mismatch - which happens reliably against this
// backend since files are decrypted on the fly while streaming, so
// the header doesn't necessarily match the decrypted body size.
// Fetching the bytes ourselves and handing react-native-pdf a
// data:application/pdf;base64 source instead sidesteps that broken
// path entirely (react-native-pdf writes base64 sources straight to
// a local file with no network/content-length check involved at all).
export default function PdfPreview({ uri }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [base64, setBase64] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBase64(null);
    setFailed(false);

    (async () => {
      try {
        const response = await fetch(uri);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const buffer = await response.arrayBuffer();
        const encoded = arrayBufferToBase64(buffer);

        if (!cancelled) setBase64(encoded);
      } catch (error) {
        console.error('PdfPreview fetch error:', error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (failed) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load this PDF.</Text>
      </View>
    );
  }

  if (!base64) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pdf
        source={{ uri: `data:application/pdf;base64,${base64}` }}
        style={styles.pdf}
        onError={(error) => {
          console.error('PdfPreview render error:', error);
          setFailed(true);
        }}
      />
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
    },

    pdf: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },

    errorText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
