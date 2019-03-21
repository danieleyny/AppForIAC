/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 * @lint-ignore-every XPLATJSCOPYRIGHT1
 */

import Icon from 'react-native-vector-icons/FontAwesome';
import React, {Component} from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import { CheckBox, Button, Divider, Header,PricingCard, Image, Tooltip, Avatar, Badge, Text, Card, Input,Overlay, SocialIcon } from 'react-native-elements'


const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
      super(props);
      this.state = { checked: false };
  }
  render() {
    return (
      <View style={styles.container}>
        <Header
          leftComponent={{ icon: 'menu', color: 'lightgreen' }}
          centerComponent={{ text: 'MY TITLE', style: { color: 'red' } }}
          rightComponent={{ icon: 'home', color: 'lightgreen' }}
        />
        <Avatar
          rounded
          source={{uri: 'http://lghttp.46505.nexcesscdn.net/801C770/images/media/catalog/product/cache/1/image/650x/040ec09b1e35df139433887a97daa66f/p/2/p2095_israel_flag_shield_patch_f.jpg',}}
          size="large"
        />
        <Tooltip
          popover={<Text style={{color:"white"}}>This is Israels Flag on a patch</Text>}
          backgroundColor="lightblue"
          >
          <Text style={{color:"lightblue"}}> Who is this?</Text>
        </Tooltip>
        <Badge value="99+" status="success"/>
        <Badge value={<Text style={{color:"white"}}>Well Done!</Text>} status="success"/>
        <Text style={styles.welcome}>Life is good!</Text>
          <Divider style={{height:20}}/>
        <Button
          titleStyle={{width:200,color:"white"}}
          title="Press Me"
        />
        <Divider style={{height:20}}/>
        <CheckBox
          onPress={() => this.setState({checked: !this.state.checked})}
          title= 'Click Here'
          checked={this.state.checked}
          checkedColor="red"
        />
        <Image
          source={{ uri: "http://www.stonybrookhillel.org/clientuploads/LOGOS/ErdvSZN8.png" }}
          style={{ width: 225, height: 100 }}
          backgroundColor="lightblue"
        />
        <Tooltip
          popover={<Text style={{color:"red"}}>This is Israeli American Council which is a company that brings israelis together to strengthen israel's support and culture through pro-israel events.</Text>}
/**
how do i extend the size of the tooltip backround color to fit the popup text.
*/
          backgroundColor="red"
          >
          <Text style={{color:"lightblue", backgroundColor:"white"}}>What is this?</Text>
        </Tooltip>
          <Divider style={{height:30}}/>
        <PricingCard
          color="lightblue"
          title="Looking for a new CEO position"
          price="$1M"
          info={['Can talk on the phone', 'Smiles at least 2 hours', 'Will talk to you about your problems']}
          button={{ title: 'Click To Hire Me', icon: 'mood'}}
          infoStyle={{color:"black"}}
        />
        <Divider style={{height:150}}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  welcome: {
    fontSize: 20,
    color: "limegreen",
    textAlign: 'center',
    margin: 5,
  },
});

/**
* Origional BackroundColor for container -  #F5FCFF
*/
