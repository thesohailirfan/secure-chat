import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TextInput,
  Text,
  KeyboardAvoidingView,
  View,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Image,
  Modal
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useAuth } from "../context/AuthContext";
import { addContact, delRequest, getLocalUser, getRequest, getUserbyUID, setRequest } from "../firebase";
import { theme } from "../theme";

export default function AddFriend(props) {
  const [toggle, settoggle] = useState(false);
  const navigation = props.navigation;

  const { login } = useAuth();

  const handleSubmit = (e) => {};

  return (
    <View>
      <View style={styles.topbar}>
        <Text
          style={{
            color: theme.textPrimary,
            fontSize: 24,
            marginHorizontal: 20,
          }}
        >
          Add New Friend
        </Text>
      </View>

      <View style={styles.topbar}>
        <TouchableOpacity onPress={(e) => { settoggle(false)}}>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 16,
              width: Dimensions.get("window").width * 0.4,
              borderBottomColor: "#000",
              borderBottomWidth: toggle ? 1 : 4,
              textAlign: "center",
              padding: 20,
            }}
          >
            Add Username
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={(e) => { settoggle(true)}}>
          <Text
            style={{
              color: theme.textPrimary,
              fontSize: 16,
              width: Dimensions.get("window").width * 0.4,
              borderBottomColor: "#000",
              borderBottomWidth: toggle ? 4 : 1,
              textAlign: "center",
              padding: 20,
            }}
          >
            Add Requests
          </Text>
        </TouchableOpacity>
      </View>

      {
        !toggle ? (
          <AddUsername navigation={navigation}/>
        ) : (
          <AddRequest navigation={navigation}/>
        )
      }
      
    </View>
  );
}

function AddUsername(props) {
  const [username, setusername] = useState("");
  const [nickname, setnickname] = useState("");
  const [error, seterror] = useState("");
  const navigation = props.navigation;
  const { currentUser } = useAuth()

  const handleSubmit = async(e) => {
    seterror("");
    console.log("Submit")
    if( username && nickname){
      let friendid = await addContact(username, nickname, " sent you a friend request.");
      if(friendid){
        setRequest(friendid, currentUser.uid)
      }
      navigation.replace("Inbox")
    }else{
      seterror("Enter all fields");
    }
  };

  return (
    <View style={styles.listView}>
      <View style={styles.listItem}>
        <View style={styles.info}>
          <View style={[styles.infoItem, { justifyContent: "center" }]}>
            <Text style={{ fontSize: 14, color: "red" }}>{error}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name={"mail"}
              size={20}
              color={theme.textPrimary}
              style={{ marginHorizontal: 10 }}
            />
            <View style={styles.flexColumn}>
              <Text style={{ fontSize: 14 }}>Username</Text>
              <TextInput
                style={styles.input}
                onChangeText={(e) => setusername(e.toLocaleLowerCase())}
                value={username}
                placeholder={"username789"}
              />
            </View>
            <View></View>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name={"person"}
              size={20}
              color={theme.textPrimary}
              style={{ marginHorizontal: 10 }}
            />
            <View style={styles.flexColumn}>
              <Text style={{ fontSize: 14 }}>Nickname</Text>
              <TextInput
                style={styles.input}
                onChangeText={(e) => setnickname(e)}
                value={nickname}
                placeholder={"Example User"}
              />
            </View>
            <View></View>
          </View>
          <View style={styles.submitItem}>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={(e) => handleSubmit(e)}
            >
              <Text>Add to Contacts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function AddRequest(props) {
  const [req, setreq] = useState(null);
  const navigation = props.navigation;
  const { currentUser } = useAuth()


  const getData = async() => {
    let allrequids = await getRequest(currentUser.uid)
    if(allrequids.length > 0){
      let temp = []
      for (let i = 0; i < allrequids.length; i++) {
        const uuid = allrequids[i];
        const res = await getUserbyUID(uuid)
        const data = {
          "username" : res.username,
          "uid" : res.uid
        }        
        temp.push(data)
      }
      setreq(temp)
    }
  }


  useEffect(() => {
    getData()
  })

  return (
    <View style={styles.listView}>
      <ScrollView>
        {
          !req &&
          <View style={styles.scrollItem}>
            <Text></Text>
            <Text style={{fontSize: 16}}>No Friend Requests</Text>
            <Text></Text>
          </View>
        }
        {
          req &&
         
          req.map((data, index)=>{
            return(
              <FriendReq key={index} username={data.username} navigation={navigation} uid={data.uid}/>
            )
          })
          
        }
      </ScrollView>
    </View>
  );
}

const FriendReq = (props) => {
  const {navigation, username, uid} = props;
  const {currentUser} = useAuth()
  const [nickname, setNickname] = useState("")
  const [modalVisible, setModalVisible] = useState(false);

  const handleSubmit = async(e) => {
    console.log("Submit")
    if( username && nickname){
      await addContact(username, nickname, " & you are friends now.");
      await delRequest(currentUser.uid, uid)
      navigation.replace("Inbox")
    }else{
      seterror("Enter all fields");
    }
  };

  const handleCancel = async(e) => {
    console.log("Cancel")
    await delRequest(currentUser.uid, uid)
    navigation.replace("Inbox")
  }

  return (
    <View style={styles.scrollItem}>
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
            <Text style={styles.modalText}>Nickname for {username}</Text>
            <TextInput
                style={[styles.input, {marginVertical: 20}]}
                onChangeText={(e) => setNickname(e)}
                value={nickname}
                placeholder={"Example User"}
              />
            <View style={{flexDirection: 'row', width: Dimensions.get("window").width *0.5, justifyContent: "space-between", alignItems: 'center'}}>
            <TouchableOpacity
              style={styles.submitBtn2}
              onPress={() => setModalVisible(!modalVisible)}>
              <Text style={styles.textStyle}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn2}
              onPress={(e) => handleSubmit(e)}
            >
              <Text>Add Friend</Text>
            </TouchableOpacity>
            </View>
           
          </View>
        </View>
      </Modal>
      <Text style={{fontSize: 18}}>{username}</Text>
      <View style={{display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        <TouchableOpacity onPress={(e) => {setModalVisible(true)}} style={{marginLeft: 10 }}>
            <Text><Ionicons name={"checkmark-circle-outline"} size={40} color={theme.textPrimary} /></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={(e) => {handleCancel(e)}} style={{marginLeft: 10 }}>
            <Text><Ionicons name={"close-circle-outline"} size={40} color={theme.textPrimary} /></Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  submitBtn2: {
    backgroundColor: theme.secondary,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 50,
  },
  modalView: {
    height: Dimensions.get("window").width * 0.8,
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
  scrollItem: {
    height: 70,
    width: Dimensions.get("window").width,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 60,
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
    height: Dimensions.get("window").height - 140,
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
