import {
  StyleSheet,
  Text,
  KeyboardAvoidingView,
  View,
  Dimensions,
  Image,
  StatusBar,
  TouchableOpacity,
  LogBox,
  Modal
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { GiftedChat } from "react-native-gifted-chat";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";
import {
  addLocalMessage,
  delFileFromServer,
  delLocalChat,
  delLocalMessage,
  delMessagefromServer,
  firestore,
  getLocalChat,
  getUrl,
  getUrlandDelete,
  getUserToken,
  sendMessage,
  storage,
} from "../firebase";
import { decrypt, encrypt } from "../encryption";
import { sendPushNotification } from "./inbox";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as FileSystem from "expo-file-system";
import { useCalling } from "../context/CallContext";

LogBox.ignoreLogs([`Setting a timer for a long period`]);

export default function Chat(props) {
  const [messages, setMessages] = useState([]);
  const [friend, setfriend] = useState();
  const { id } = props.route.params;
  const { currentUser } = useAuth();
  const [token, settoken] = useState();
  const [image, setImage] = useState();
  const [displayImage, setDisplayImage] = useState();
  const [modalVisible, setModalVisible] = useState(false);
  const {navigation} = props

  const {create} = useCalling()

  const getData = async () => {
    try {
      let data = await getLocalChat(currentUser.uid, id);
      let tokenID = await getUserToken(id);
      settoken(tokenID);
      data.uid = id;
      setfriend(data);
      let allMessages = [];
      for (let i = data.messages.length - 1; i >= 0; i--) {
        const msg = decrypt(data.messages[i]);

        if (msg && !checkDuplicate(allMessages, [msg])) {
          allMessages.push(msg);
        }
      }
      
      setMessages(allMessages);
      getmessages()
    } catch (e) {
      console.log(e);
    }
  };

  const getmessages = async () => {
    firestore
      .collection("user")
      .doc(currentUser.uid)
      .collection("message")
      .onSnapshot(async (doc) => {
        console.log("Current data: ");
        doc.forEach(async (data) => {
          let res = data.data();
          const jsonValue = res.message;
          const msgObj = jsonValue != null ? decrypt(jsonValue) : null;
          if(!checkDuplicate(messages, [msgObj]) && res.from === id){
              if (msgObj.hasOwnProperty("imgRef")) {
                console.log(msgObj.imgRef);
                let imgUrl = await getUrl(msgObj.imgRef);
                console.log(imgUrl);

                const downloadResumable = FileSystem.createDownloadResumable(
                  imgUrl,
                  FileSystem.documentDirectory +
                    msgObj.imgRef.slice(
                      msgObj.imgRef.lastIndexOf("/") + 1,
                      msgObj.imgRef.length
                    ),
                  {}
                );

                try {
                  const { uri } = await downloadResumable.downloadAsync();
                  
                    msgObj.image = uri;
                    console.log("Finished downloading to ", uri);

                } catch (e) {
                  console.error(e);
                }
              }

              const msgArr = [msgObj];
          
              setMessages((previousMessages) => GiftedChat.append(previousMessages, msgArr))
              addLocalMessage(encrypt(msgObj), currentUser.uid + res.from);
              delMessagefromServer(currentUser.uid, data.id);
          }
               
        });
      });
  };

  useEffect(() => {
    console.log("Fetching Data");
    getData();
  }, []);

  function checkDuplicate(all, msg){
    if(all && msg){
      for (let i = 0; i < all.length; i++) {
        const msgObj = all[i];

        if(msgObj._id == msg[0]._id){
          return true
        }
        
      }
    }
    return false
  }

  const onSend = useCallback(
    async (message = []) => {
      let customMsg = message[0]
      customMsg.pending = true
      if (image) {
        setDisplayImage(null)

        let msg = customMsg;
        msg["image"] = image;
        setMessages((previousMessages) => GiftedChat.append(previousMessages, [msg])); 
        const filename = image.slice(image.lastIndexOf("/") + 1, image.length);
        const type = image.slice(image.lastIndexOf(".") + 1, image.length);
        const ts = Date.now();

        const imgRef = ts.toString() + "/" + filename;
        const res = await uploadBlob(image, imgRef);        
        msg["imgRef"] = imgRef;
        
        await sendPushNotification(
          token,
          currentUser.email.slice(0, currentUser.email.indexOf("@")) + " : 🖼️ Photo ",
          msg.text
        );
        msg.pending = false;
        msg.sent = true;
        await sendMessage(msg, currentUser.uid, id);
        
        setImage(null);
        getData()
      } else {
        setMessages((previousMessages) => GiftedChat.append(previousMessages, [customMsg]));
        
        await sendPushNotification(
          token,
          currentUser.email.slice(0, currentUser.email.indexOf("@")) + " : ",
          customMsg.text
        );
        customMsg.pending = false;
        customMsg.sent = true;
        await sendMessage(customMsg, currentUser.uid, id);
        getData()       
        
        // let temp = messages
        // temp.unshift(customMsg);
        // setMessages(temp)
        console.log(messages[0]); 
      }
      
      
    },
    [image, token, messages]
  );

  const pickImage = async (e) => {
    e.preventDefault();
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.cancelled) {
      const urlLocal = result.uri.toString();
      setImage(urlLocal);
      setDisplayImage(urlLocal)
    }
  };

  async function uploadBlob(file, imgRef) {
    const response = await fetch(file);
    const blob = await response.blob();

    try {
      const ref = await storage.ref().child(imgRef).put(blob);
      return ref
    } catch (e) {
      console.log(e);
      return null;
    }
    // [END storage_upload_blob]
  }

  const handleDelete = async (e) => {
    console.log("Delete")
    await delLocalChat(currentUser.uid, id)
    navigation.replace("Inbox")
  }

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert('Modal has been closed.');
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={[styles.modalText, { marginVertical: 20}]}>Are you sure you want to delete this chat ? </Text>
            <View style={{flexDirection: 'row', width: Dimensions.get("window").width *0.5, justifyContent: "space-between", alignItems: 'center'}}>
            <TouchableOpacity
              style={styles.submitBtn2}
              onPress={() => setModalVisible(!modalVisible)}>
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn2}
              onPress={(e) => handleDelete(e)}
            >
              <Text>Yes, I do</Text>
            </TouchableOpacity>
            </View>
           
          </View>
        </View>
      </Modal>


      <View style={[styles.topbar, {justifyContent:"space-between"}]}>
        <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{marginHorizontal: 10 }}><Ionicons name={"chatbubbles"} size={22} color={theme.textPrimary} /></Text>
          
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 20,
              marginHorizontal: 0,
            }}
          >
            {" "}
            {friend ? friend.nickname : "Loading ... "}{" "}
          </Text>
        </View>
        
        <TouchableOpacity onPress={(e) =>{setModalVisible(true)}} >
            <Text><Ionicons name={"trash-outline"} size={22} color={theme.textPrimary} /></Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={(e) =>{create(id)}} style={{marginHorizontal: 10 }}>
            <Text><Ionicons name={"call"} size={22} color={theme.textPrimary} /></Text>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1, backgroundColor: "#f1f1f1" }}>
        <GiftedChat
          messages={messages}
          onSend={(message) => onSend(message)}
          user={{
            _id: currentUser.uid,
          }}
        />
        {/* {
              Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />
          } */}
      </View>
      {displayImage && (
        <View style={styles.imgView}>
          <Image
            source={{ uri: displayImage }}
            style={{ width: 120, height: 120, resizeMode: "contain" }}
          />
          <TouchableOpacity
            onPress={(e) => {
              e.preventDefault();
              setImage(null);
              setDisplayImage(null)
            }}
            style={{ marginHorizontal: 10 }}
          >
            <Text>
              <Ionicons name={"close"} size={20} color={theme.textPrimary} />
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[styles.topbar, { height: 50 }]}
        onPress={(e) => pickImage(e)}
      >
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 16,
            marginHorizontal: 20,
          }}
        >
          {" "}
          Select Photo{" "}
        </Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  submitBtn2: {
    backgroundColor: theme.secondary,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 50,
  },
  modalView: {
    height: Dimensions.get("window").width * 0.6,
    width: Dimensions.get("window").width * 0.8,
    backgroundColor: theme.primary,
    justifyContent: "center",
    alignItems: "center"
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  imgView: {
    width: Dimensions.get("window").width,
    height: 120,
    backgroundColor: theme.primary,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  submitBtn: {
    backgroundColor: theme.secondary,
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 50,
  },
  input: {
    borderBottomColor: "#555",
    borderBottomWidth: 1,
    height: 40,
    width: Dimensions.get("window").width * 0.65,
  },
  info: {
    marginTop: 50,
  },
  submitItem: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: Dimensions.get("window").width,
    paddingHorizontal: 30,
    marginVertical: 15,
  },
  infoItem: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: Dimensions.get("window").width,
    paddingHorizontal: 30,
    marginVertical: 15,
  },
  flexColumn: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 30,
  },
  flexRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  listView: {
    height: Dimensions.get("window").height - 70,
    backgroundColor: theme.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  time: {
    paddingHorizontal: 20,
    fontSize: 12,
  },
  listItem: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 100,
  },
  profile: {
    width: Dimensions.get("window").width / 2,
    height: Dimensions.get("window").width / 2,
    borderRadius: 200,
    marginHorizontal: 20,
  },
  topbar: {
    width: Dimensions.get("window").width,
    height: 70,
    backgroundColor: theme.primary,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  addButton: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.secondary,
    height: 60,
    width: 60,
    position: "absolute",
    zIndex: 2,
    top: Dimensions.get("window").width / 2 - 60,
    right: 20,
    borderRadius: 50,
  },
});
