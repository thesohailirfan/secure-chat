import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import * as React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import Ionicons from "react-native-vector-icons/Ionicons";

import Inbox from "./src/views/inbox";
import Chat from "./src/views/chat";
import Settings from "./src/views/settings";
import SignUp from "./src/views/signup";
import { theme } from "./src/theme";
import Login from "./src/views/login";
import AddFriend from "./src/views/addfriend";
import { auth, firestore, getLogin } from "./src/firebase";
import { RTCIceCandidate, RTCPeerConnection, RTCView } from "react-native-webrtc";
import Utils from "./src/utils";
import { CallProvider, useCalling } from "./src/context/CallContext";

const Stack = createNativeStackNavigator();

function NavContainer() {
  const [loading, setloading] = React.useState(true);
  const [state, setState] = React.useState(false);
  const { login, currentUser } = useAuth();
  const { calling, hangup, connecting, getCalling, join, localStream, remoteStream, name } = useCalling()


  const getData = async () => {
    const loginData = await getLogin();
    if (loginData) {
      const loginStat = await login(loginData.username, loginData.password);
      setloading(false);
    } else {
      setloading(false);
    }
  };

  

  React.useEffect(() => {
    getData();
  }, [remoteStream]);

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={calling}
        onRequestClose={() => {
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>

            <View
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={[styles.modalText, { marginVertical: 0, fontSize: 15 }]}
              >
                { remoteStream ? "In a call" : "Incoming Call"}
                
              </Text>
              <Text
                style={[styles.modalText, { marginVertical: 0, fontSize: 12 }]}
              >
                { remoteStream ? "with" : "from"}
              </Text>
              <Text
                style={[
                  styles.modalText,
                  {
                    marginVertical: 30,
                    marginBottom: 60,
                    fontSize: 20,
                    fontWeight: "bold",
                  },
                ]}
              >
                {name}
              </Text>
            </View>
            {
              localStream &&
              <>
              <Text>Local Stream : </Text>
              <RTCView streamURL={localStream.toURL()} objectFit={'contain'} style={{height: 30, width:30, borderColor: '#000', borderWidth: 1}} />
              </>
            }
            {
              remoteStream &&
              <>
              <Text>Remote Stream : </Text>
              <RTCView streamURL={remoteStream.toURL()} objectFit={'contain'} style={{height: 30, width:30, borderColor: '#000', borderWidth: 1}} />
              </>
            }
            <View
              style={{
                flexDirection: "row",
                width: Dimensions.get("window").width * 0.5,
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                style={[
                  styles.submitBtn2,
                  {
                    backgroundColor: "#FF0000",
                    transform: [{ rotate: "135deg" }],
                  },
                ]}
                onPress={(e) => hangup()}
              >
                <Text style={styles.textStyle}>
                  <Ionicons name={"call"} size={22} color={"#fff"} />
                </Text>
              </TouchableOpacity>

              {getCalling && 
                <TouchableOpacity
                  style={[styles.submitBtn2, { backgroundColor: "#008000" }]}
                  onPress={(e) => join()}
                >
                  <Text>
                    <Ionicons name={"call"} size={22} color={"#fff"} />
                  </Text>
                </TouchableOpacity>
              }
              
            </View>
          </View>
        </View>
      </Modal>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {loading ? (
            <>
              <Stack.Screen name="Loading" component={Loading} />
            </>
          ) : (
            <>
              {currentUser ? (
                <>
                  <Stack.Screen name="Inbox" component={Inbox} />
                  <Stack.Screen name="Settings" component={Settings} />
                  <Stack.Screen name="Chat" component={Chat} />
                  <Stack.Screen name="AddFriend" component={AddFriend} />
                </>
              ) : (
                <>
                  <Stack.Screen name="Login" component={Login} />
                  <Stack.Screen name="SignUp" component={SignUp} />
                </>
              )}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <View style={styles.container}>
      <AuthProvider>
        <CallProvider>
          <NavContainer />
        </CallProvider>
      </AuthProvider>
    </View>
  );
}

function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="small" color="#000" />
      <Text>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryDark,
    marginTop: StatusBar.currentHeight,
  },
  loading: {
    flex: 1,
    color: theme.textPrimary,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtn2: {
    backgroundColor: theme.secondary,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 100,
  },
  modalView: {
    height: Dimensions.get("window").height * 0.8,
    width: Dimensions.get("window").width * 0.8,
    backgroundColor: theme.primary,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
