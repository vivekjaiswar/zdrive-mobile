import { useState } from 'react';
import { Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RazorpayOrder } from '@/services/billing.service';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  visible: boolean;
  order: RazorpayOrder | null;
  planName: string;
  userEmail?: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onDismiss: () => void;
}

// There's no official Razorpay React Native SDK dependency added here -
// that would need a native module + config plugin + a fresh dev-client
// build, which is a much bigger lift than this feature needs. Standard
// Checkout is a plain web script (checkout.razorpay.com/v1/checkout.js,
// already allowlisted in the frontend's own CSP - see next.config.ts),
// so it's loaded here as local HTML inside a WebView instead, with the
// payment result bridged back to RN via postMessage. Same approach the
// web app already uses, just embedded rather than loaded as a page.
function buildCheckoutHtml(order: RazorpayOrder, planName: string, email?: string) {
  const options = {
    key: order.keyId,
    amount: order.amount,
    currency: order.currency,
    order_id: order.orderId,
    name: 'Zennial Drive',
    description: `Upgrade to ${planName}`,
    prefill: email ? { email } : undefined,
    theme: { color: '#2F6FED' },
  };

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>html, body { margin: 0; padding: 0; background: transparent; }</style>
  </head>
  <body>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      function post(payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }

      var options = ${JSON.stringify(options)};
      options.handler = function (response) {
        post({
          type: 'success',
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
        });
      };
      options.modal = {
        ondismiss: function () {
          post({ type: 'dismiss' });
        },
      };

      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        post({ type: 'failed', reason: response.error && response.error.description });
      });
      rzp.open();
    </script>
  </body>
</html>`;
}

// Some payment methods (UPI apps, netbanking redirects) try to navigate
// the WebView to a non-http(s) URL scheme it can't actually render -
// hand those off to the OS instead of letting the WebView fail silently.
function isExternalScheme(url: string) {
  return !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:');
}

export default function RazorpayCheckoutModal({
  visible,
  order,
  planName,
  userEmail,
  onSuccess,
  onDismiss,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [failed, setFailed] = useState(false);

  if (!order) return null;

  function handleMessage(raw: string) {
    try {
      const payload = JSON.parse(raw);

      if (payload.type === 'success') {
        onSuccess(payload.paymentId, payload.orderId, payload.signature);
        return;
      }

      if (payload.type === 'failed') {
        setFailed(true);
        return;
      }

      if (payload.type === 'dismiss') {
        onDismiss();
      }
    } catch {
      // Malformed bridge message - nothing sensible to do but ignore it.
    }
  }

  function handleNavigation(request: WebViewNavigation | { url: string }) {
    if (isExternalScheme(request.url)) {
      Linking.openURL(request.url).catch(() => {});
      return false;
    }
    return true;
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable onPress={onDismiss} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.topBarTitle}>Complete Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        {failed ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.failedText}>Payment failed. You can close this and try again.</Text>
            <Pressable style={styles.closeButton} onPress={onDismiss}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            source={{ html: buildCheckoutHtml(order, planName, userEmail) }}
            style={styles.webview}
            originWhitelist={['*']}
            domStorageEnabled
            javaScriptEnabled
            mixedContentMode="always"
            onShouldStartLoadWithRequest={handleNavigation}
            onMessage={(event) => handleMessage(event.nativeEvent.data)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    topBarTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },

    webview: {
      flex: 1,
      backgroundColor: colors.background,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },

    failedText: {
      marginTop: 16,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    closeButton: {
      marginTop: 24,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.surfaceAlt,
    },

    closeText: {
      fontWeight: '700',
      color: colors.text,
    },
  });
}
