import React, { useState } from "react";
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
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { color } from "react-native/Libraries/Components/View/ReactNativeStyleAttributes";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

export default function SignUp(props) {
    const [username, setusername] = useState("");
    const [password, setpassword] = useState("");
    const [confirm, setconfirm] = useState("");
    const [error, seterror] = useState("");
    const navigation = props.navigation;
    const { signup } = useAuth()

    const handleSubmit = async (e) => {
        seterror("")

        if(password !== confirm){
            seterror("Passwords do not match")
            return null
        }

        if(password.length < 6){
            seterror("Passwords should be more than 6 charecters")
            return null
        }

        try{
            let res = await signup(username.toLocaleLowerCase() +"@securechat.app", password)
            console.log(res)
            if(!res.success) {
                seterror(res.message)
            }
        }
        catch(e){
            console.log(e)
        }
        
    }

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
                    Sign Up
                </Text>
            </View>
            <View style={styles.listView}>
                <View style={styles.listItem}>
                    <View style={styles.info}>
                        <View style={[styles.infoItem,{justifyContent: 'center'}]}>
                            <Text style={{ fontSize: 14, color: 'red' }}>{error}</Text>    
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
                                name={"key"}
                                size={20}
                                color={theme.textPrimary}
                                style={{ marginHorizontal: 10 }}
                            />
                            <View style={styles.flexColumn}>
                                <Text style={{ fontSize: 14 }}>Password</Text>
                                <TextInput
                                    style={styles.input}
                                    onChangeText={(e) => setpassword(e)}
                                    value={password}
                                    secureTextEntry={true}
                                    placeholder={"Password@123"}
                                />
                            </View>
                            <View></View>
                        </View>
                        <View style={styles.infoItem}>
                            <Ionicons
                                name={"key"}
                                size={20}
                                color={theme.textPrimary}
                                style={{ marginHorizontal: 10 }}
                            />
                            <View style={styles.flexColumn}>
                                <Text style={{ fontSize: 14 }}>Confirm Password</Text>
                                <TextInput
                                    style={styles.input}
                                    onChangeText={(e) => setconfirm(e)}
                                    value={confirm}
                                    secureTextEntry={true}
                                    placeholder={"Password@123"}
                                />
                            </View>
                            <View></View>
                        </View>
                        <View style={styles.submitItem}>
                            <TouchableOpacity style={styles.submitBtn} onPress={(e) => handleSubmit(e)}>
                                <Text>Create Account</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.submitItem}>
                            <TouchableOpacity onPress={(e) => navigation.navigate("Login")}>
                                <Text style={{ fontWeight: "bold" }}>Go to Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
