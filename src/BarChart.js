import React, { Component } from 'react';
import { View } from 'react-native';
import AnimatedBar from './AnimatedBar'




export default class BarChart extends Component {



    constructor(props) {
        super(props);

        this.disposeData(true) 
        

    }

    shouldComponentUpdate(nextProps){
        //console.log("SHOULD UPDATE?: ",!(nextProps.dataY==this.props.dataY))
        return !(nextProps.dataY==this.props.dataY)

    }

    componentDidUpdate = (prevProps, prevState, snapshot)=>{
        if(this.props.dataY!=prevProps.dataY){
            //console.log("DIDUPDATE BARCHART")
            this.disposeData(false,prevState.dataY)
        }
        
    }
    //This function will normalize the input data to fit the available space
    disposeData = async (init=false,prevDataY=false)=>{

        let max = Math.max(...this.props.dataY)
        max=this.props.dataY.length==0 || max==0?1:max
       
        let dataTransformed = this.props.dataY.map(v=>Math.round(100-(v*80/max)))

        let containerStyles = this.props.containerStyles

        let height = this.props.height?Math.round(this.props.height):100

        containerStyles.height = height


        dataTransformed = dataTransformed.map(v=>Math.round(v*height/100))
        

        let length = this.props.dataY.length
        length = length==0?1:length

        let margin = Math.round((100/(length*4)))
        margin = margin<0.05?0.05:margin

        

        let state = {
            containerStyles:containerStyles,
            dataY:dataTransformed,
            labels:this.props.labels,
            color:this.props.color?this.props.color:"red",
            margin:margin,
            prevDataY:prevDataY,
        }

        if(init){
            this.state = state
        }else{
            await this.setState(state)
        }
        this.forceUpdate()
        
    }

    render() {
        return (
            <View
                style={[
                    this.state.containerStyles,
                    {
                        paddingLeft:this.state.margin+'%',
                        paddingRight:this.state.margin+'%',
                        flexDirection:"row",
                        justifyContent:"space-around",
                        overflow:"hidden"
                    }
                ]}
            >
                {this.state.dataY.map((v,i)=><AnimatedBar key={"animatedBar-"+Math.random()*100} label={this.state.labels[i]} prevValue={this.state.prevDataY?this.state.prevDataY[i]:false} value={v} margin={this.state.margin} color={this.state.color} />)}
            </View>
        )
    }
}