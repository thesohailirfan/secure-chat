import React, { useContext, useState, useEffect, useRef, createContext } from "react";
import { MediaStream, RTCIceCandidate, RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";
import { auth, createUser, firestore, saveLogin, updateUser } from "../firebase";

import Utils from "../utils";
import { sendPushNotification } from "../views/inbox";
import { useAuth } from "./AuthContext";

const CallContext = createContext();

export function useCalling() {
  return useContext(CallContext);
}

export function CallProvider({ children }) {
    const {currentUser} = useAuth()
    let username = ""
    if(currentUser){
      username = currentUser.email.slice(0, currentUser.email.indexOf("@"))
    }
    const [calleeUID, setcalleeUID] = useState()
    const [calling, setcalling] = useState(false);
    const [localStream, setlocalStream] = useState(null);
    const [remoteStream, setremoteStream] = useState(null);
    const [getCalling, setgetCalling] = useState(false);
    const [name, setname] = useState(null);
    const pc = useRef();
    const connecting = useRef(false);
    const config = { iceServers: [{ url: "stun:stun.l.google.com:19302" }] };
    const [startTime, setstartTime] = useState(null);

    

    // Set Up WebRTC
    const setupWebRTC = async () => {
      console.log("Setting Up WebRTC");
        pc.current = new RTCPeerConnection(config);
        const stream = await Utils.getStream();
  
        if (stream) {
          setlocalStream(stream);
          pc.current.addStream(stream);
          
        }
        pc.current.addEventListener('stream', async (event) =>{
          console.log("Stream : ",event)
          setremoteStream(event.stream);
        })
        // pc.current.onaddStream = (event) => {
          
        // };
    };

    //Create a Call
    const create = async (uid, name, token) => {
        setcalleeUID(uid)
        setname(name)
        if(currentUser){
          setcalling(true)
          console.log("Staring a call");
          connecting.current = true;

          

          const cRef = firestore.collection("calls").doc(uid)

          if(!(await cRef.get()).exists){
            await setupWebRTC();
            const userRef = cRef.collection("caller")
            const friendRef = cRef.collection("callee")

            collectIceCandidates(userRef, friendRef)

            if(pc.current){
            const offer = new RTCSessionDescription(await pc.current.createOffer())
            await pc.current.setLocalDescription(offer);
            console.log( "User : ", username)
            console.log("States : ",pc.current.signalingState)

            

            const cWithOffer = {
                offer: offer.toJSON(),
                name: username
            }

            cRef.set(cWithOffer)
            }

            await sendPushNotification(
              token,
              currentUser.email.slice(0, currentUser.email.indexOf("@")),
              " is calling you"
            );
          }else{
            setname("In Another Call")
          }
        }
    };

    // Joining a Call
    const join = async () => {
      if(currentUser){
        console.log("Joining a call");
        connecting.current = true;
        setgetCalling(false)

        const cRef = firestore.collection("calls").doc(currentUser.uid)
        const offer = (await cRef.get()).data().offer

        if(offer){

          await setupWebRTC();

          console.log("States : ",pc.current.signalingState, pc.current.iceConnectionState)

          const userRef = cRef.collection("callee")
          const friendRef = cRef.collection("caller")

          collectIceCandidates(userRef, friendRef)

          if(pc.current){
            
            await pc.current.setRemoteDescription(new RTCSessionDescription(offer))
            console.log( "User : ", username)
            console.log("States : ",pc.current.signalingState)
            const answer = new RTCSessionDescription(await pc.current.createAnswer())
            await pc.current.setLocalDescription(answer);
            console.log( "User : ", username)
            console.log("States : ",pc.current.signalingState)
            
            

            let rStream = new MediaStream(pc.current.getRemoteStreams()[0])
            console.log(rStream)
            setremoteStream(rStream)

            const cWithAnswer = {
                answer:answer.toJSON(),
                startTime: Date.now(),
            }
            cRef.update(cWithAnswer)
          }else{
            console.log("No Peer Connection")
          }
        }
      }
    };

    // Hanging up a call
    const hangup = async () => {
      
      setname(null)
      setcalleeUID(null)
      setstartTime(null)
      setgetCalling(false)
      setcalling(false)
      connecting.current = false;
      streamCleanUp();
      firestoreCleanUp();

      if(pc.current){
        pc.current.close()
      }
    };

    const streamCleanUp = async () => {
      if(localStream){
        localStream.getTracks().forEach((t)=> t.stop());
        localStream.release();
      }
      setlocalStream(null);
      setremoteStream(null);
    };

    const firestoreCleanUp = async () => {

      if(currentUser){
        let cRef = firestore.collection("calls").doc(currentUser.uid)
        if(calleeUID){
          cRef = firestore.collection("calls").doc(calleeUID)
        }

        if(cRef){
          const calleeCandidate = await cRef.collection('callee').get()
          calleeCandidate.forEach(async(candidate)=>{
            await candidate.ref.delete()
          })

          const callerCandidate = await cRef.collection('caller').get()
          callerCandidate.forEach(async(candidate)=>{
            await candidate.ref.delete()
          })

          cRef.delete()
        }
      }
    };

    const collectIceCandidates = async (userRef, friendRef) => {
        if (pc.current) {
        // On new ICE candidate add it to firestore
        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
              try{
                userRef.add(event.candidate.toJSON());
              }catch(err){
                console.log(err)
              }
            }
        };
        }

        friendRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach( change =>{
            if(change.type == 'added'){
              const candidate = new RTCIceCandidate(change.doc.data())
              //console.log("Candidate",change.doc.data())
              pc.current.addIceCandidate(candidate)
            }
        })
        })
    }

  const getAnswer = async (answer) => {
          console.log( "Answering setting remote")
          console.log( "User : ", username)
          console.log("States : ",pc.current.signalingState)
          console.log(answer.type)
          await pc.current.setRemoteDescription(new RTCSessionDescription(answer))
          console.log( "User : ", username)
          console.log("States After : ",pc.current.signalingState)
          let rStream = new MediaStream(pc.current.getRemoteStreams()[0])
          console.log(rStream)
          setremoteStream(rStream)
  }

  useEffect(() => {
    //setupWebRTC()
  },[])

  useEffect(() => {
    console.log(localStream, remoteStream)
  },[localStream, remoteStream])

  useEffect(() => {
    if(currentUser){
      let cRef = firestore.collection("calls").doc(currentUser.uid)
      if(calleeUID){
        cRef = firestore.collection("calls").doc(calleeUID)
      }
      const subscribe = cRef.onSnapshot(snapshot=>{
        const data = snapshot.data()

        if(data){
          if(!calleeUID){
            setname(data.name)
          }
          console.log("Same Username ? ", username , data.name === username)
          console.log("Got Answer ? ",data && data.answer && data.name === username)
          if(data.startTime){
            setstartTime(data.startTime)
          }
        }
        
        if(data && data.answer && data.name === username){
          getAnswer(data.answer)
          
        }

        if(data && data.offer && !connecting.current){
          setgetCalling(true)
          setcalling(true)
        }
      })

      const subscribeDelete = cRef.collection('callee').onSnapshot(snapshot=>{
        snapshot.docChanges().forEach( change=>{
          if(change.type == 'removed'){
            hangup()
          }
        })
      })
    
      return () => {
        subscribe()
        subscribeDelete()
      };
    }
    
  }, [currentUser, calleeUID]);

  const value = { calling, setcalling, create, join, hangup, localStream, remoteStream, getCalling, name,connecting, calleeUID, startTime };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}
