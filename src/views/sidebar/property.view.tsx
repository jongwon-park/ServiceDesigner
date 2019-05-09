import React from 'react';
import { Input, Label } from 'reactstrap'
import { Layout } from './layout.view'
import Utils from '../../utils/utils';
import AceEditor from 'react-ace';
import 'brace/theme/github';
import 'brace/mode/css';
import 'brace/ext/language_tools';
import { View } from '../view';
import { Action } from '../../utils/constant';
import { Element } from '../../models/element';

export class SidebarProperty extends View {

    state:any = {
        value: '',
        selectedItem: {}
    }

    componentWillMount() {
        this.update();
    }

    componentWillReceiveProps() {
        this.update();
    }

    update() {
        const selectedItem = this.mainCtrl.getSelectedElement();
        if (this.state.selectedItem !== selectedItem) {
            this.setState({
                value: selectedItem.style,
                selectedItem: selectedItem
            });
        }
    }
    
    render() {
        return <div>
            <Layout />
            <h5>Style</h5>
            <AceEditor
                style={{width:'100%', height:200}}
                theme="github" 
                mode="css" 
                value={this.state.value}
                onChange={(value)=> {
                    this.setState({value:value})
                }}
                onValidate={(value)=> {
                    let error = false;
                    value.forEach(item=> {
                        if (item.type === 'error') error = true;
                    });
                    if (!error && this.state.selectedItem.style !== this.state.value) {
                        const file = this.mainCtrl.getSelectedFile();
                        const elem = this.mainCtrl.getSelectedElement();
                        let parent;
                        Utils.loop(file.element, (item:Element)=> {
                            item.children.forEach((child:Element)=> {
                                if (child.id === elem.id) {
                                    parent = item;
                                }
                            })
                        })
                        const after = elem.clone();
                        after.style = this.state.value;
                        console.log(parent);
                        this.mainCtrl.elementControl(Action.Update, parent, elem.clone(), after);
                    }
                }}
                showPrintMargin={true}
                showGutter={true}
                highlightActiveLine={true}
                editorProps={{$blockScrolling: Infinity }}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: false,
                    showLineNumbers: true,
                    tabSize: 2
                }}
                />
            
            <h5>Property</h5>
            {
                this.state.selectedItem.property && Object.keys(this.state.selectedItem.property).map(key=> {
                    return <div key={key}>
                        <Label style={styles.propLabel}>{key}</Label>
                        <Input style={styles.propValue} value={this.state.selectedItem.property[key]} onChange={(e)=>{
                            const prop = Utils.deepcopy(this.state.selectedItem.property);
                            prop[key] = e.target.value;
                            const file = this.mainCtrl.getSelectedFile();
                            const elem = this.mainCtrl.getSelectedElement();
                            let parent;
                            Utils.loop(file.element, (item:Element)=> {
                                item.children.forEach((child:Element)=> {
                                    if (child === elem) {
                                        parent = item;
                                    }
                                })
                            })
                            const after = elem.clone();
                            after.property = prop;
                            this.mainCtrl.elementControl(Action.Update, parent, elem.clone(), after);
                        }}/>
                    </div>
                })
            }
        </div>
    }
}

const styles = {
    propLabel: {
        display:'inline-block',
        width:'30%'
    },
    propValue: {
        display: 'inline-block',
        width:'70%'
    }
}