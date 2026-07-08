import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Colors from '@/theme/colors';
import { ZDriveFile } from '@/types/file';

interface Props {
  file: ZDriveFile;
  onPress: () => void;
}

function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes/1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes/1024/1024).toFixed(1)} MB`;
  return `${(bytes/1024/1024/1024).toFixed(1)} GB`;
}

function icon(mime?: string){
  if(!mime) return 'file-outline';
  if(mime.includes('pdf')) return 'file-pdf-box';
  if(mime.includes('image')) return 'file-image';
  if(mime.includes('video')) return 'file-video';
  if(mime.includes('audio')) return 'file-music';
  if(mime.includes('zip')) return 'folder-zip';
  return 'file-outline';
}

export default function FileCard({file,onPress}:Props){
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name={icon(file.mimeType) as any} size={28} color={Colors.primary}/>
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>{file.name}</Text>
        <Text style={styles.meta}>{formatSize(file.size)}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#94A3B8"/>
    </Pressable>
  );
}

const styles=StyleSheet.create({
 card:{backgroundColor:'#fff',borderRadius:18,padding:16,marginBottom:12,flexDirection:'row',alignItems:'center'},
 icon:{width:52,height:52,borderRadius:26,backgroundColor:'#EEF5FF',justifyContent:'center',alignItems:'center'},
 content:{flex:1,marginLeft:14},
 name:{fontSize:16,fontWeight:'600',color:Colors.text},
 meta:{marginTop:4,fontSize:13,color:Colors.textSecondary}
});
