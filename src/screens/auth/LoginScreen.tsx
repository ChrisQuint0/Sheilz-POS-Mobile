import { View, StyleSheet, Image } from "react-native";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/shielz_pos_logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 200,
  },
});
