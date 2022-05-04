import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, KeyboardAvoidingView, View, TouchableOpacity, StatusBar, Dimensions, ScrollView, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { getLocalChat, getLocalUser, setUserToken } from '../firebase';
import { decrypt } from '../encryption';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

export default function Inbox(props) {
    const [user, setuser] = useState()
    const [inbox, setinbox] = useState(null)
    const navigation = props.navigation
    const { currentUser } = useAuth()
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if(token){
                setUserToken(currentUser.uid, token)
            }
        });

        // This listener is fired whenever a notification is received while the app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
        });

        // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        console.log(response);
        });

        return () => {
        Notifications.removeNotificationSubscription(notificationListener.current);
        Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);
    
    const getData = async () => {
        try { 
            const data = await getLocalUser()
            console.log("User : ",data)
            setuser(data)
            await getFriendData(data)
        } catch(e) {
        // error reading value
        }
    }

    const getFriendData = async (user) => {
        if(user.friends.length > 0){
            let inboxTemp = []
            for (let i = 0; i < user.friends.length; i++) {
                try {
                    const id = user.friends[i];
                    const data = await getLocalChat(user.uid , id)
                    data.uid = id
                    inboxTemp.push(data)
                } catch(e) {
                 console.log(e)
                } 
            }
            setinbox(inboxTemp)
        }
    }

    const pad = num => ("0" + num).slice(-2);

    const getTimeFromDate = timestamp => {
        const date = new Date(timestamp);
        let hours = date.getHours(),
          minutes = date.getMinutes(),
          seconds = date.getSeconds();
        return pad(hours) + ":" + pad(minutes)
      }

    useEffect(() => {
        getData()
        
        
    }, [])
    
    return (
        <View>
            <View style={styles.topbar}>

                <Text style={{ color: theme.textPrimary, fontSize: 26, fontWeight: 'bold', marginHorizontal: 15 }}>Inbox</Text>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={(e) => {navigation.navigate("AddFriend")}} style={{marginHorizontal: 10 }}>
                        <Text><Ionicons name={"person-add"} size={22} color={theme.textPrimary} /></Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity onPress={(e) => { logout() }} style={{marginHorizontal: 10 }}>
                        <Text><Ionicons name={"power"} size={20} color={theme.textPrimary} /></Text>
                    </TouchableOpacity> */}
                    <TouchableOpacity onPress={(e) => { getData() }} style={{marginHorizontal: 10 }}>
                        <Text><Ionicons name={"refresh"} size={22} color={theme.textPrimary} /></Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity onPress={(e) => { sendPushNotification(123) }} style={{marginHorizontal: 10 }}>
                        <Text><Ionicons name={"person"} size={20} color={theme.textPrimary} /></Text>
                    </TouchableOpacity> */}
                </View>
                

            </View>
            {/* <TouchableOpacity style={styles.addButton}><Text><Ionicons name={"add"} size={26} color={theme.textPrimary} /></Text></TouchableOpacity> */}
            <View style={styles.listView}>
                <ScrollView>
                    { 
                        inbox &&
                            <>
                            {
                                inbox.map((data, index) => {
                                    
                                    let lastMessage
                                    if(data.messages.length>0){
                                        lastMessage = decrypt(data["messages"][0])

                                        for (let i = 1; i < data.messages.length; i++) {
                                            const msgs = decrypt(data.messages[i]);

                                            if(msgs){
                                                
                                                if( new Date(lastMessage.createdAt).getTime() < new Date(msgs.createdAt).getTime()){
                                                    lastMessage = msgs
                                                }
                                            }
                                        }
                                        
                                        if(!lastMessage){
                                            lastMessage = {
                                                createdAt: new Date(),
                                                text : "Tap to Chat"
                                            }
                                        }
                                    }else{
                                        lastMessage = {
                                            createdAt: new Date(),
                                            text : "Tap to Chat"
                                        }
                                    }
                                    
                                    return (
                                        <TouchableOpacity style={styles.listItem} key={index} onPress={(e) => { navigation.navigate("Chat", { id : data.uid}) }}>
                                            
                                            <View style={{ flex: 1, marginHorizontal: 30}}>
                                                <Text style={{ fontSize: 18, fontWeight: 'bold' }}> {data.nickname} </Text>
                                                <Text style={{ fontSize: 14 }}> {lastMessage.text} </Text>
                                            </View>
                                            <Text style={styles.time}> { getTimeFromDate(lastMessage.createdAt)}</Text>
                                        </TouchableOpacity>
                                    )
                                })
                            }
                            </>
                    }

                    {
                        !inbox &&
                        <View style={[styles.listItem,{justifyContent: 'center'}]}>
                            <Text style={{ fontSize: 14}}>You don't have any contacts yet.</Text>
                        </View>
                    }

                </ScrollView>
            </View>
        </View>
    )
}

export async function sendPushNotification(expoPushToken, title, body) {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
    };

    console.log("Notification",message);
  
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  }
  
  async function registerForPushNotificationsAsync() {
    let token;
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
    } else {
      alert('Must use physical device for Push Notifications');
    }
  
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  
    return token;
  }


const styles = StyleSheet.create({
    listView: {
        height: Dimensions.get('window').height - 70,
        backgroundColor: theme.primaryDark,
    },
    time: {
        paddingHorizontal: 20,
        fontSize: 12
    },
    listItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 90,
        marginTop: 10
    },
    profile: {
        width: 60,
        height: 60,
        borderRadius: 50,
        marginHorizontal: 20
    },
    topbar: {
        width: Dimensions.get('window').width,
        height: 70,
        backgroundColor: theme.primary,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20
    },

    addButton: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.secondary,
        height: 60,
        width: 60,
        position: "absolute",
        zIndex: 2,
        top: Dimensions.get('window').height - 90,
        right: 20,
        borderRadius: 50
    }
});