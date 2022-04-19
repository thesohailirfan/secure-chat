import React from 'react'
import { StyleSheet, Text, KeyboardAvoidingView, View, TouchableOpacity, StatusBar, Dimensions, ScrollView, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme'

export default function Settings(props) {
    const navigation = props.navigation
    const {logout} = useAuth()

    const data = {
        name: 'Sohail Irfan',
        img: 'https://instagram.fccu10-1.fna.fbcdn.net/v/t51.2885-19/264957228_3057598714523186_7339371374225261884_n.jpg?stp=dst-jpg_s150x150&_nc_ht=instagram.fccu10-1.fna.fbcdn.net&_nc_cat=102&_nc_ohc=a0HI0h-zNu0AX8ZWBgy&edm=ALbqBD0BAAAA&ccb=7-4&oh=00_AT-xDvS1mRGkmi2tDAgHG7Kve1LeeGU_gha-AGxANCs6ag&oe=62290ABE&_nc_sid=9a90d6',
        email: 'thesohailirfan@gmail.com'
    }
    return (
        <View>
            <View style={styles.topbar}>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={(e) => { navigation.navigate("Inbox") }}><Text><Ionicons name={"arrow-back"} size={24} color={theme.textPrimary} /></Text></TouchableOpacity>
                    <Text style={{ color: theme.textPrimary, fontSize: 24, marginHorizontal: 20 }}>Settings</Text>

                </View>


            </View>
            <View style={styles.listView}>

                <View style={styles.listItem}>
                    <View>
                        <Image
                            style={styles.profile}
                            source={{
                                uri: data.img
                            }}
                        />
                        <TouchableOpacity style={styles.addButton}><Text><Ionicons name={"camera"} size={26} color={theme.textPrimary} /></Text></TouchableOpacity>
                    </View>

                    <View style={styles.info}>
                        <View style={styles.infoItem}>
                            <Ionicons name={"person"} size={20} color={theme.textPrimary} style={{ marginHorizontal: 10 }} />
                            <View style={styles.flexColumn}>
                                <Text style={{ fontSize: 14, }}> Name</Text>
                                <Text style={{ fontSize: 18, fontWeight: 'bold' }}> {data.name} </Text>
                            </View>
                            <View><Ionicons name={"pencil"} size={20} color={theme.secondary} style={{ marginHorizontal: 10 }} /></View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons name={"mail"} size={20} color={theme.textPrimary} style={{ marginHorizontal: 10 }} />
                            <View style={styles.flexColumn}>
                                <Text style={{ fontSize: 14, }}> Email</Text>
                                <Text style={{ fontSize: 18, fontWeight: 'bold' }}> {data.email} </Text>
                            </View>
                            <View></View>

                        </View>

                        <View style={styles.submitItem}>
                            <TouchableOpacity style={styles.submitBtn} onPress={(e) => {logout()} }>
                                <Text>Log Out</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    submitItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: Dimensions.get('window').width,
        paddingHorizontal: 30,
        marginVertical: 30
    },
    submitBtn: {
        backgroundColor: theme.secondary,
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 50
    },
    info: {
        marginTop: 50,
    },
    infoItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: Dimensions.get('window').width,
        paddingHorizontal: 30,
        marginVertical: 15
    },
    flexColumn: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 30
    },
    flexRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listView: {
        height: Dimensions.get('window').height - 70,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    time: {
        paddingHorizontal: 20,
        fontSize: 12
    },
    listItem: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        marginBottom: 100
    },
    profile: {
        width: Dimensions.get('window').width / 2,
        height: Dimensions.get('window').width / 2,
        borderRadius: 200,
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
        top: (Dimensions.get('window').width / 2) - 60,
        right: 20,
        borderRadius: 50
    }
});