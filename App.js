/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  Button,
  FlatList,
  TouchableOpacity,
  TouchableHighlight
} from 'react-native';

import {
  Header,
  Colors,
} from 'react-native/Libraries/NewAppScreen';
import DateTimePicker from '@react-native-community/datetimepicker';
import firebase from 'react-native-firebase';
import type { Notification } from 'react-native-firebase';
import type { RemoteMessage } from 'react-native-firebase';
import Modal from 'react-native-modal';
const Realm = require('realm');
const moment = require('moment');

function App() {
  const [flights, setFlights] = useState([]);
  const [date, setDate] = useState(new Date());
  const [dateString, setDateString] = useState("");
  const [show, setShow] = useState(false);
  const [flightData, setFlightData] = useState({});
  const [realm, setRealm] = useState(null);
  const [history, setHistory] = useState([]);
  const [modal, setModal] = useState(false);
  const FlightSchema = {
    name: 'Flight',
    properties: {
      date:'string',
      destination:  'string',
      time: 'string',
      no:'string',
      airline:'string'
    }
  }; 
  const onChange = (event, selectedDate) => {
    
    setShow(Platform.OS === 'ios');
    setFlights([]);
    setFlightData({});
    var currentDate = selectedDate;
    setDate(currentDate);
    currentDate = currentDate.toISOString().substring(0,10);
    setDateString(currentDate);
    
    //console.log(currentDate);
    //console.log(flights);
    
    
  };
  const setReminder = () => {
    console.log(flights);
    var a = moment().utcOffset(8,true);
    var b = moment([dateString.substring(0,4), String(parseInt(dateString.substring(5,7))-1), dateString.substring(8,10),flightData.time.substring(0,2), flightData.time.substring(3,5)],0).utcOffset(8, true);
    var diff = b.diff(a,'minutes');
    
    Realm.open({
      schema: [FlightSchema]
    }).then(realm => {
      realm.write(() => {
        realm.create('Flight', { 
        date: dateString,
        destination:  flightData.destination,
        time: flightData.time,
        no: flightData.no,
        airline:flightData.airline
      });
      });
      
          const notification = new firebase.notifications.Notification()
          .setNotificationId('test')
          .setTitle('FLIGHT ARRIVING')
          .setBody('Flight '+flightData.airline+' with destination to '+flightData.destination+' arriving in 1 hour')
          .setData({
            key1: 'value1',
            key2: 'value2',
          });
          notification
          .android.setChannelId('test')
          .android.setSmallIcon('ic_launcher');
          const date = new Date();
          console.log(diff);
          date.setMinutes(date.getMinutes() + diff-60);
          firebase.notifications().scheduleNotification(notification, {
              fireDate: date.getTime(),
          })
          //firebase.notifications().displayNotification(notification);
          setRealm(realm);

    }).catch((err)=>console.log(err));
    setModal(false);
  }
  useEffect(()=>{
        if(history.length==0){
          Realm.open({
        schema: [FlightSchema]
      }).then(realm => {
        realm.write(() => {
        let flight = realm.objects('Flight'); 
          if(flight.length!=0){
            let distinct = flight.filtered('TRUEPREDICATE DISTINCT(airline)');
            let array = Array.from(distinct);
            setRealm(realm);
            setHistory(array)
          }
        });
        //data.close();
      }).catch((err)=>console.log(err));
      }
   
    
     // Build a channel
     const channel = new firebase.notifications.Android.Channel('test', 'Test Channel', firebase.notifications.Android.Importance.Max)
     .setDescription('My apps test channel');

     // Create the channel
     firebase.notifications().android.createChannel(channel);
    firebase.messaging().hasPermission()
    .then(enabled => {
      if (enabled) {
        // user has permissions
        console.log("User have permission !");
       
        firebase.messaging().getToken()
        .then(fcmToken => {
          if (fcmToken) {
            // user has a device token
            console.log(fcmToken);
            firebase.messaging().subscribeToTopic("test");
          } else {
            // user doesn't have a device token yet
            console.log("no token yet");
          } 
        });
        
        this.removeNotificationListener = firebase.notifications().onNotification((notification: Notification) => {
          // Process your notification as required
         
          notification
          .android.setChannelId('test')
          .android.setSmallIcon('ic_launcher');
          console.log("notification:"+notification);
          firebase.notifications().displayNotification(notification);
          /*
          const date = new Date();
          date.setMinutes(date.getMinutes() + 1);

          firebase.notifications().scheduleNotification(notification, {
              fireDate: date.getTime(),
          })
          */
          /*
          this.onTokenRefreshListener = firebase.messaging().onTokenRefresh(fcmToken => {
            // Process your token as required
            console.log(fcmToken+" registered");
          });
          this.messageListener = firebase.messaging().onMessage((message: RemoteMessage) => {
            // Process your message as required
            console.log("remote message get");
         });
         */
      });
      } else {
        console.log("no permission");
             firebase.messaging().requestPermission();
       
      } 
    });
    
    if(dateString!=""&&flights.length==0){
      fetch("https://www.hongkongairport.com/flightinfo-rest/rest/flights/past?date="+dateString+"&lang=en&cargo=false&arrival=false",{
      method:"GET",
      headers:{
          "Content-Type":"application/json"
      }
  }).then(response => {
      return response.json();
  }).then(data => {
      var array = [];
      data.map((data)=>{

          data.list.map((data)=>{
          var  destination = "";
          data.destination.map((data)=>{
            destination = data;
          });
          var time = data.time;
          data.flight.map((data)=>{
            array.push({"destination":destination, "time":time, "no":data.no, "airline":data.airline});

          });
          
          setFlights(array);
          
        });
        
        
        
        
       // console.log("response :"+JSON.stringify(array));
       
      });
      
  }).catch(err => {
      console.log(err);
  })

 
    }
    return function cleanup() {
      /*
      this.onTokenRefreshListener();
      this.messageListener();
      */
      //this.removeNotificationListener();
      /*
      if (realm !== null && !realm.isClosed) {
          realm.close();
      }*/
      firebase.messaging().unsubscribeFromTopic("test");
    };
  });
  return (
    <View>
    <StatusBar barStyle="dark-content" />
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          </ScrollView>
          {global.HermesInternal == null ? null : (
            <View style={styles.engine}>
              <Text style={styles.footer}>Engine: Hermes</Text>
            </View>
          )}
          <View style={styles.body}>
            <View style={styles.sectionContainer}>
              <Modal isVisible={modal} style={{left:20, height:'40%', width:'80%'}}>
                <View style={{ backgroundColor:'white', justifyContent:"center"}}>
                  <Text style={{textAlign:"center"}}>Set Reminder ?</Text>
                  <Button title="Yes" onPress={()=>{setReminder()}}></Button>
                  <Button title="No" onPress={()=>{setModal(false);setFlightData({});}}></Button>
                </View>
              </Modal>
              <View>
                <Text style={{fontSize:30, fontWeight:"bold"}}>HONGKONG FLIGHT</Text>
              </View>
              <View>
                <Text>Recent Flight Selected</Text>
                <FlatList
                
                style= {{flex: 0}}
                data={history}
                ListEmptyComponent={()=>{return <View><Text>Empty</Text></View>}}
                renderItem={({item})=>{
                  
  
                  return <TouchableOpacity style={{padding:20,borderColor:'black', borderRadius:1, borderWidth:1 }} onPress={()=>{setModal(true);setFlightData({"destination":item.destination,"time":item.time,"no":item.no,"airline":item.airline})}  }>
                  <View style={{left:20}}>
                  <Text>Time:{item.time}</Text>
                  <Text>Destination:{item.destination}</Text>
                  <Text>No: {item.no}</Text>
                  <Text>Airline: {item.airline}</Text>
                  </View>
                  </TouchableOpacity>
                  
                  
                }}
                keyExtractor={(item)=>{item.index}}
              />
              </View>
              <View>
                <Button onPress={()=>{setShow(true)}} title="Pick Date" />
              </View>
              {show && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={onChange}
                />
              )}
              <Text>Selected Date : {dateString}</Text>
              <View>
            <FlatList
                style= {{flex: 0}}
                data={flights}
                ListEmptyComponent={()=>{return <View><Text>Empty</Text></View>}}
                renderItem={({item, index, separators})=>{
                  
  
                  return <TouchableOpacity key={index} style={{padding:20, borderColor:'black', borderRadius:1, borderWidth:1}} onPress={()=>{setModal(true);setFlightData({"destination":item.destination,"time":item.time,"no":item.no,"airline":item.airline})}}>
                  <View style={{left:20}}>
                  <Text>Time:{item.time}</Text>
                  <Text>Destination:{item.destination}</Text>
                  <Text>No: {item.no}</Text>
                  <Text>Airline: {item.airline}</Text>
                  </View>
                  </TouchableOpacity>
                  
                  
                }}
                keyExtractor={(item, index)=>{index}}
              />
            </View>
              </View>
              
              </View>
          </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: Colors.lighter,
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: Colors.white,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});

export default App;
