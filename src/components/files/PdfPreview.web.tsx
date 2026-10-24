import { StyleSheet, View } from 'react-native';

interface Props {
  uri: string;
}

export default function PdfPreview({ uri }: Props) {
  return (
    <View style={styles.wrap}>
      <iframe
        src={uri}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="PDF Preview"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
