import React, {Component, createRef} from 'react';
import ActionSheet from 'react-native-actions-sheet/src/index';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Alert,
} from 'react-native';
import {CheckBox} from 'react-native-elements';

export default class ActShtCreateConversation extends Component {
  constructor(props) {
    super(props);

    this.ref = createRef();
    this.state = {
      convName: '',
      participantString: '',
      isGroup: false,
      isDistinc: false,
    };
  }

  show = () => {
    this.ref.current.show();
  };

  hide = () => {
    this.ref.current.hide();
  };

  render(): React.ReactNode {
    return (
      <ActionSheet
        containerStyle={this.styles.container}
        ref={this.ref}
        bounceOnOpen={true}
        defaultOverlayOpacity={0.3}>
        <SafeAreaView>
          <Text style={this.styles.title}>Conversation name: </Text>
          <TextInput
            style={this.styles.input}
            placeholder="Conversation name"
            onChangeText={text => {
              this.setState({
                convName: text,
              });
            }}
          />

          <View style={this.styles.row}>
            <CheckBox
              center
              title="Is group"
              checked={this.state.isGroup}
              onPress={() => {
                this.setState({
                  isGroup: !this.state.isGroup,
                });
              }}
            />
            <CheckBox
              center
              title="Is distinct"
              checked={this.state.isDistinct}
              onPress={() => {
                this.setState({
                  isDistinct: !this.state.isDistinct,
                });
              }}
            />
          </View>

          <Text style={this.styles.title}>Participant: </Text>
          <TextInput
            style={this.styles.input}
            placeholder="user's id, user's id 2"
            onChangeText={text => {
              this.setState({
                participantString: text,
              });
            }}
          />

          <View style={this.styles.rowButton}>
            <TouchableOpacity
              style={this.styles.button}
              onPress={() => {
                const options = {
                  name: this.state.convName,
                  isDistinct: this.state.isDistinct,
                  isGroup: this.state.isGroup,
                };

                const participant = this.state.participantString
                  .replace(/ /g, '')
                  .split(',');

                if (!this.state.isGroup && participant.length > 1) {
                  Alert.alert(
                    '1:1 conversation cannot have more than 2 participant',
                  );
                  return;
                }
                this.hide();
                this.props.data(options, participant);
              }}>
              <Text style={this.styles.text}>Create</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ActionSheet>
    );
  }
  styles = StyleSheet.create({
    container: {
      marginBottom: 10,
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
    },
    input: {
      height: 40,
      borderWidth: 1,
      marginHorizontal: 10,
      padding: 10,
    },
    row: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      textAlign: 'left',
      margin: 10,
      fontWeight: 'bold',
    },
    text: {
      textAlign: 'center',
      color: '#F5FCFF',
      fontWeight: 'bold',
      fontSize: 15,
    },
    rowButton: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
    },
    button: {
      margin: 10,
      paddingVertical: 10,
      paddingHorizontal: 5,
      width: '45%',
      justifyContent: 'center',
      backgroundColor: '#1E6738',
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#fff',
    },
  });
}
