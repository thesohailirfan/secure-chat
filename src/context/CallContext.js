import React, { useContext, useState, useEffect, useRef, createContext } from "react";
import { RTCIceCandidate, RTCPeerConnection } from "react-native-webrtc";
import { auth, createUser, firestore, saveLogin, updateUser } from "../firebase";
import Utils from "../utils";
import { useAuth } from "./AuthContext";

const CallContext = createContext();

export function useCalling() {
  return useContext(CallContext);
}

export function CallProvider({ children }) {
    const {currentUser} = useAuth()
    const [calling, setcalling] = useState(true);
    const [localStream, setlocalStream] = useState(null);
    const [remoteStream, setremoteStream] = useState(null);
    const [getCalling, setgetCalling] = useState(null);
    const pc = useRef();
    const connecting = useRef(false);
    const config = { iceServers: [{ url: "stun:stun.l.google.com:19302" }] };

    

    // Set Up WebRTC
    const setupWebRTC = async () => {
        pc.current = new RTCPeerConnection(config);
        const stream = await Utils.getStream();
        if (stream) {
        setlocalStream(stream);
        pc.current.addStream(stream);
        }
        pc.current.onaddstream = (event) => {
        setremoteStream(event.stream);
        };
    };

    //Create a Call
    const create = async (uid) => {
        console.log("Staring a call");
        connecting.current = true;

        await setupWebRTC();

        const cRef = firestore.collection("calls").doc(uid)
        const userRef = cRef.collection("caller")
        const friendRef = cRef.collection("callee")

        collectIceCandidates(userRef, friendRef)

        if(pc.current){
        const offer = await pc.current.createOffer()
        pc.current.setLocalDescription(offer);

        const cWithOffer = {
            offer:{
            type: offer.type,
            sdp: offer.sdp
            }
        }

        cRef.set(cWithOffer)
        }
    };
    const join = async () => {};

    const hangup = async () => {};

    const collectIceCandidates = async (userRef, friendRef) => {
        if (pc.current) {
        // On new ICE candidate add it to firestore
        pc.current.onicecandidate = (event) => {
            if (event.candidate) {
            userRef.add(event.candidate.toJSON());
            }
        };
        }

        friendRef.onSnapshot(snapshot => {
        snapshot.docChanges().forEach( change =>{
            if(change.type == 'added'){
            const candidate = new RTCIceCandidate(change.doc.data())
            pc.current.addIceCandidate(candidate)
            }
        })
        })
    }

  useEffect(() => {
    
    return () => {
      
    };
  }, []);

  const value = { calling, setcalling, create };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
}
