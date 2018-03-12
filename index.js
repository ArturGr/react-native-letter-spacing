import React, { Component } from 'react'
import { View, Text, StyleSheet, Animated, TextStyle } from 'react-native'

function getTexts(arr) {
    let words = arr.split(' ')
    if (words.length > 1) {
        words = words.map(i =>
            i.split('')
        )
        return words
    } else {
        return [words]
    }
}

export default class extends Component {

    constructor(props) {
        super(props);
        this.fontSize = props.style && StyleSheet.flatten(props.style).fontSize ? StyleSheet.flatten(props.style).fontSize : 18;
        let lineHeight = this.fontSize * 1.365;
        this.state = {
            fontSize: new Animated.Value(this.fontSize),
            firstHiddenWord: -1,
            simpleAdd: false,
            lastLetterCount: -1,
            height: props.linesCount ? props.linesCount * lineHeight : -1,
        };
        this.resetState();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.children != nextProps.children) {
            this.resetState();
            this.fontSize = nextProps.style && StyleSheet.flatten(nextProps.style).fontSize ? StyleSheet.flatten(nextProps.style).fontSize : 18;
            let lineHeight = this.fontSize * 1.365;
            this.setState({
                firstHiddenWord: -1,
                simpleAdd: false,
                lastLetterCount: -1,
                height: nextProps.linesCount ? nextProps.linesCount * lineHeight : -1
            });
        }
    }

    shouldComponentUpdate(nextProps) {
        if (this.props.children != nextProps.children || this.redrawing) {
            return true;
        }
        return false;
    }

    resetState() {
        this.viewsArray = {};
        this.viewLettersArray = {};
        this.firstHiddenWordIndex = -1;
        this.words = "";
        this.redrawing = false;
        this.dotsWidth = 30;
        this.width = 0;
    }

    render() {
        const { style, letterSpacing, textAlign, containerStyle, children, linesCount } = this.props
        let { wordSpacing } = this.props
        if (!wordSpacing) {
            wordSpacing = letterSpacing * 3
        }
        if (!wordSpacing) {
            wordSpacing = 15
        }

        let words = getTexts(children);
        this.words = words;
        this.viewsArray = {};
        let tempRedrawing = this.redrawing;
        if (this.redrawing) {
            this.redrawing = false
        }
        return (
            <View style={[containerStyle, this.state.height ? { height: this.state.height } : undefined]}>
                <View style={[styles.word, { position: 'absolute', opacity: 0 }]}
                    onLayout={(event) => { this.dotsWidth = event.nativeEvent.layout.width }} >
                    {
                        ['.', '.', '.'].map((j, index) => {
                            return <Animated.Text
                                style={[style, index > 0 && { marginLeft: letterSpacing }, this.props.animated && { fontSize: this.state.fontSize }]}
                                key={"Dot_" + index}>{j}</Animated.Text>
                        })
                    }
                </View>
                <View onLayout={linesCount ? (event) => {
                    if (this.width == 0) {
                        this.width = event.nativeEvent.layout.width;
                        setTimeout(() => {
                            this.checkVisibleText(wordSpacing);
                        }, 50)
                    }
                } : undefined}
                    style={[styles.wrapper, { marginLeft: -1 * wordSpacing }, textAlign === 'center' && { justifyContent: 'center' }, textAlign === 'right' && { justifyContent: 'flex-end' }]}>
                    {
                        words.map((i, ind) => {
                            if (tempRedrawing && ind == this.state.firstHiddenWord - 1) {
                                if (this.state.simpleAdd) {
                                    i.push('.', '.', '.')
                                } else {
                                    i = i.slice(0, this.state.lastLetterCount + 1);
                                    i.push('.', '.', '.')
                                }
                            }
                            if (!tempRedrawing || (tempRedrawing && ind < this.state.firstHiddenWord)) {
                                return <View onLayout={linesCount && ((event) => {
                                    if (!tempRedrawing) {
                                        this.viewsArray[ind] = event.nativeEvent.layout;
                                        let height = linesCount * event.nativeEvent.layout.height;
                                        if (height - (event.nativeEvent.layout.height / 2) < event.nativeEvent.layout.y) {
                                            if (ind && (ind < this.firstHiddenWordIndex || this.firstHiddenWordIndex < 0)) {
                                                this.firstHiddenWordIndex = ind;
                                            }
                                        }
                                    }
                                })}
                                    style={[
                                        styles.word, { marginLeft: wordSpacing },
                                        textAlign === 'center' && { justifyContent: 'center' }
                                    ]}
                                    key={ind}>
                                    {
                                        i.map((j, index) => {
                                            return <Animated.Text onLayout={(event) => {
                                                if (this.viewLettersArray.hasOwnProperty(ind)) {
                                                    this.viewLettersArray[ind][index] = event.nativeEvent.layout;
                                                } else {
                                                    this.viewLettersArray[ind] = {};
                                                    this.viewLettersArray[ind][index] = event.nativeEvent.layout;
                                                }
                                            }}
                                                style={[style, index > 0 && { marginLeft: letterSpacing }, this.props.animated && { fontSize: this.state.fontSize }]}
                                                key={index}>{j}</Animated.Text>
                                        })
                                    }
                                </View>
                            }
                        })
                    }

                </View>
            </View>
        )
    }

    checkVisibleText(spacing) {
        if (this.firstHiddenWordIndex > 0 && this.firstHiddenWordIndex != this.state.firstHiddenWord && this.viewsArray.hasOwnProperty(this.firstHiddenWordIndex - 1)) {
            let visibleIndex = this.firstHiddenWordIndex - 1;
            let wordX = this.viewsArray[visibleIndex].x;
            let width = this.viewsArray[visibleIndex].width;
            let cSpacing = wordX - 1 < spacing ? 0 : spacing;
            let diff = this.getEndDiff(wordX, cSpacing, width);
            if (diff > this.dotsWidth) {
                //Detect if last Word can be drawen!!
                let nextIndex = this.firstHiddenWordIndex;
                if (this.words.hasOwnProperty(nextIndex)) {
                    let nextWordLetterCount = this.words[nextIndex].length - 1;
                    let nextWordLetterArray = this.viewLettersArray[nextIndex];
                    nextWordLetterCount = Math.min(nextWordLetterCount, 2);
                    let nextWordWidthSmal = this.getLeterWidth(nextWordLetterArray, 2);
                    let nextWordX = this.viewsArray[nextIndex].x;
                    let nextWordEndDiff = diff - spacing - nextWordWidthSmal;
                    if (nextWordEndDiff > this.dotsWidth) {
                        let maxletterCount = this.words[nextIndex].length - 1;
                        let letterCount = 2;
                        let wordWithLetersWidth = this.getLeterWidth(nextWordLetterArray, letterCount);
                        let diffToEnd = diff - spacing - wordWithLetersWidth
                        while (diffToEnd > this.dotsWidth) {
                            letterCount++;
                            wordWithLetersWidth = this.getLeterWidth(nextWordLetterArray, letterCount);
                            diffToEnd = diff - spacing - wordWithLetersWidth;
                            if (letterCount > maxletterCount) {
                                break;
                            }
                        }
                        letterCount = letterCount - 1;
                        this.redrawing = true;
                        this.setState({ firstHiddenWord: this.firstHiddenWordIndex + 1, simpleAdd: false, lastLetterCount: letterCount, height: -1 })
                        return;
                    }
                }
            }
            let letterArray = this.viewLettersArray[visibleIndex];
            let letterCount = this.words[visibleIndex].length;
            let finalCount = letterCount
            let diffToEnd = this.getEndDiff(wordX, cSpacing, this.getLeterWidth(letterArray, letterCount - 1))
            while (diffToEnd < this.dotsWidth) {
                diffToEnd = this.getEndDiff(wordX, cSpacing, this.getLeterWidth(letterArray, letterCount - 1));
                letterCount--;
                if (letterCount < 0) {
                    break;
                }
            }
            this.redrawing = true;
            this.setState({ firstHiddenWord: this.firstHiddenWordIndex, simpleAdd: false, lastLetterCount: letterCount, height: -1 })

        }
    }

    getEndDiff(startX, spacing, width) {
        return this.width - startX - spacing - width - 3;
    }

    getLeterWidth(letterArray, index) {
        if (letterArray.hasOwnProperty(index)) {
            let letterWi = letterArray[index].x + letterArray[index].width;
            return letterWi;
        }
        return 0;
    }




    setFontSizeTo(size, time) {
        Animated.timing(this.state.fontSize, // The value to drive
            {
                toValue: size,
                duration: time,
            }).start(); // Start the animation
    }
}

const styles = StyleSheet.create({
    word: {
        flexDirection: 'row'
    },
    wrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap'
    },
    text: {
        margin: 0,
        padding: 0
    }

})
