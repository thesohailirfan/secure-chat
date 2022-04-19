import { StyleSheet, Text, View, Dimensions, StatusBar, ActivityIndicator } from 'react-native';
import * as React from 'react';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from "./src/context/AuthContext";


import Inbox from './src/views/inbox';
import Chat from './src/views/chat';
import Settings from './src/views/settings';
import SignUp from './src/views/signup';
import { theme } from './src/theme';
import Login from './src/views/login';
import AddFriend from './src/views/addfriend';
import { auth, getLogin } from './src/firebase';


const Stack = createNativeStackNavigator();



function NavContainer(){
  const [loading, setloading] = React.useState(true)
  const [state, setState] = React.useState(false)
  const { login, currentUser } = useAuth()

  const getData = async () => {
    const loginData = await getLogin()
    console.log(loginData)
    if(loginData){
      const loginStat = await login(loginData.username, loginData.password)
      console.log(loginStat)
      setloading(false)  
    }else{
      setloading(false)
    }    
  }

   
  React.useEffect(() => {
    getData()
  }, [])


  
  
  

  return(
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        {
          loading ? (
            <>
              <Stack.Screen name="Loading" component={Loading} />
            </>
          ):(
            <>
              {
                currentUser ? (
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
                )
              }
            </>
          )
        }
      </Stack.Navigator>
    </NavigationContainer>
  )
}


export default function App() {
  return (
    <View style={styles.container}>
      <AuthProvider>
        <NavContainer/>
      </AuthProvider>
    </View>
  );
}

function Loading(){
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="small" color="#000"/>
      <Text>Loading...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primaryDark,
    marginTop: StatusBar.currentHeight,
  },
  loading:{
    flex: 1,
    color: theme.textPrimary,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center'
  }
});
