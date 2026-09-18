import { Image, StyleSheet, View } from 'react-native';

interface Props {
  size?: number;
}

// Official Google 'G' logo vector image via CDN/Base64 URI for crisp multi-color rendering
const GOOGLE_G_LOGO_URI =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png';

export default function GoogleLogo({ size = 20 }: Props) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri: GOOGLE_G_LOGO_URI }}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
