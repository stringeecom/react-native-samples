import React, {Component, createRef} from 'react';
import ActionSheet from 'react-native-actions-sheet/src/index';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';

export default class ActShtGetConversation extends Component {
  constructor(props) {
    super(props);

    this.ref = createRef();
    this.state = {
      title: props.title,
      isNumber: props.isNumber,
      data: '',
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
          <Text style={this.styles.title}>{this.state.title + ':'}</Text>
          <TextInput
            style={this.styles.input}
            placeholder={this.state.title}
            keyboardType={this.state.isNumber ? 'numeric' : 'default'}
            onChangeText={text => {
              this.setState({
                data: text,
              });
            }}
          />

          <View style={this.styles.rowButton}>
            <TouchableOpacity
              style={this.styles.button}
              onPress={() => {
                this.hide();
                this.props.data(this.state.data);
              }}>
              <Text style={this.styles.text}>Get</Text>
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
