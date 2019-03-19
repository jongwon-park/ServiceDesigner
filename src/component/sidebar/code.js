import React from 'react';
import { ListGroup, 
    ListGroupItem, 
    Button,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Input,
    Label
} from 'reactstrap'
import {FaPlus, FaEdit} from 'react-icons/fa'
import comData from '../../resource/components.json'
import PusbubService from '../../service/pubsub.service'
import ReactJSONEditor from '../reactJsonEditor'
import Utils from '../../service/utils'
import AceEditor from 'react-ace'
import 'brace/mode/jsx'
import 'brace/theme/github'

export default class SidebarCode extends React.Component {
    state = {
        components: [],
        modal: false,
        id:-1,
        code: '',
        name:'',
        import: '',
        property: {},
    }

    componentWillMount() {
        this.setState({components:comData})
    }

    toggle = ()=> {
        this.setState({modal:!this.state.modal})
    }

    save = () => {
        if (this.isValid()) {
            this.toggle()
            this.state.components.push({
                name:this.state.name,
                import: this.state.import,
                code:this.state.code,
                property: Utils.deepcopy(this.state.property) 
            })
        }
    }

    isValid() {
        return true
    }

    editComponent = (item) => {
        this.setState({
            modal: true,
            id: item.id,
            name: item.name,
            code: item.code,
            import: item.import,
            property: Utils.deepcopy(item.property),
        })
    }

    addComponent = () => {
        this.setState({
            modal: true,
            id: -1,
            name: '',
            code: '',
            import: '',
            property: {}
        })
    }

    clickComponent = (item) => {
        PusbubService.pub(PusbubService.KEY_INSERT_COMPONENT, item)
    }

    render() {
        return <div>
            <h5>Code</h5>
            <div style={styles.listView}>
                <ListGroup>
                    {
                        this.state.components.map(item=> {
                            return <ListGroupItem action key={item.name} style={{cursor:'pointer'}} onClick={()=>{
                                    this.clickComponent(item)
                                }}>
                                {item.name}
                                <FaEdit style={styles.editIcon} onClick={()=> this.editComponent(item)}/>
                            </ListGroupItem>
                        })
                    }
                </ListGroup>
                <Button color="success" style={styles.listItem} onClick={this.addComponent}><FaPlus />Element</Button>
            </div>
            <Modal isOpen={this.state.modal} toggle={this.toggle} className={this.props.className}>
                <ModalHeader toggle={this.toggle}>Add Element</ModalHeader>
                <ModalBody>
                    <Label>Name</Label>
                    <Input type="text" onChange={(e)=>this.setState({name:e.target.value})} value={this.state.name} />
                    <Label>import</Label>
                    <AceEditor 
                        style={{width:'100%', height:45}}
                        theme="github" 
                        mode="jsx" 
                        value={this.state.import}
                        onChange={(value)=> this.setState({import:value})}
                        editorProps={{
                          $blockScrolling: false,
                        }} />
                    <Label>Code</Label>
                    {this.sandbox()}
                    <Label>Property</Label>
                    {this.setProperty()}
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={this.save}>Save</Button>{' '}
                    <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </div>
    }

    sandbox() {
        return <AceEditor 
            style={{width:'100%', height:200}}
            theme="github" 
            mode="jsx" 
            value={this.state.code}
            onChange={(value)=> this.setState({code:value})}
            editorProps={{
              $blockScrolling: false,
            }} />
    }

    setProperty() {
        return <ReactJSONEditor values={this.state.property} onChange={(values)=>this.setState({property:values})}/>
    }
}

const styles = {
    listView: {
        padding:5
    },
    listItem: {
        marginTop:5,
        width:'100%'
    },
    editIcon:{
        fontSize:20,
        float:'right',
        cursor:'pointer'
    },
    propertyKey: {
        width:'40%',
        display:'inline-block'
    },
    propertyValue: {
        width:'60%',
        display:'inline-block'
    }
}