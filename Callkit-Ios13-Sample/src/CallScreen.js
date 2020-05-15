import React, { Component, useState } from "react";
import { StyleSheet, Text, TouchableHighlight, View, TextInput } from "react-native";
import { StringeeClient, StringeeCall, StringeeVideoView, StringeeRemoteVideoView } from "stringee-react-native";

class CallScreen extends Component {

  render() {
    return (
      <View style={styles.centeredView}>
        <View style={styles.videoGroupView}>
          <View style={styles.videoView}>
            {this.props.hasLocalStream && this.props.stringeeCallId != '' && <StringeeVideoView
              style={{ flex: 1 }}
              callId={this.props.stringeeCallId}
              streamId=''
              local={true}
            />}
          </View>

          <View style={styles.videoView}>
            {this.props.hasRemoteStream && this.props.stringeeCallId != '' && <StringeeVideoView
              style={{ flex: 1 }}
              callId={this.props.stringeeCallId}
              streamId=''
              local={false}
            />}
          </View>
        </View>

        <View style={styles.buttonGroupView}>

          {/* <TouchableHighlight
            style={styles.rejectButton}
            onPress={() => {
              this.setModalVisible(true);
            }}
          >
            <Text style={styles.textStyle}>Reject</Text>
          </TouchableHighlight> */}

          <TouchableHighlight
            style={styles.endButton}
            visible
            onPress={() => {
              this.props.endButtonHandler();
            }}
          >
            <Text style={styles.textStyle}>End</Text>
          </TouchableHighlight>

          {/* <TouchableHighlight
            style={styles.answerButton}
            onPress={() => {
              this.setModalVisible(true);
            }}
          >
            <Text style={styles.textStyle}>Answer</Text>
          </TouchableHighlight> */}

        </View>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },

  videoGroupView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row"
  },

  videoView: {
    height: 200,
    width: 150,
    backgroundColor: 'black',
    marginRight: 20,
    marginLeft: 20
  },

  buttonGroupView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row"
  },

  answerButton: {
    backgroundColor: "green",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginBottom: 300,
    alignItems: "center",
    marginRight: 20,
    marginLeft: 20
  },

  endButton: {
    backgroundColor: "red",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginBottom: 300,
    alignItems: "center"
  },

  rejectButton: {
    backgroundColor: "red",
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginBottom: 300,
    alignItems: "center",
    marginRight: 20,
    marginLeft: 20
  },

  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    width: 80
  },
});

export default CallScreen;
