import React, { Component } from 'react';
import { Animated , Text} from 'react-native';



let animation 

export default class AnimatedBar extends Component {



    constructor(props) {
        
        super(props);


        //console.log("CONSTRUCT")
        this.updateValue()
        

    }
    updateValue = ()=>{
        
        animation = new Animated.Value(this.props.prevValue?this.props.prevValue:20)


        Animated.sequence([
            Animated.delay(Math.round(Math.random()*400)),
            Animated.timing(
                animation,
                {
                    toValue: this.props.value,
                    duration: 200,
                    useNativeDriver: true,
                }
            )
        ]).start()
        
    }

    componentDidUpdate = (prevProps, prevState, snapshot)=>{
        if(prevProps!=this.props){
            this.updateValue()
        }
        
    }
    componentDidMount = ()=>{
        

    }

    render() {
        return (
            <Animated.View
               key={"bar-"+Math.random()*100}
                style={{
                    flex:1,
                    overflowX:'visible',
                    backgroundColor:this.props.color,
                    marginLeft:this.props.margin+'%',
                    marginRight:this.props.margin+'%',
                    height:'100%',
                    borderRadius:25,
                    alignItems:'center',
                    transform: [
                        { translateY:animation},
                    ], 
                }}
            >
                <Text style={{position:'absolute',width:45,top:-22,fontWeight:'700',color:'grey', fontSize:16 }} >{this.props.label}</Text>
            </Animated.View>
        )
    }
}