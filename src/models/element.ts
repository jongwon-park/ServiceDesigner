import { Library, LibraryKeys } from './library';
import Utils from '../utils/utils';

export class ElementStyle {
    condition:string = '';
    style:string = 'style{\n\n}';

    toJson() {
        return {
            condition: this.condition,
            style: this.style
        }
    }

    clone() {
        return ElementStyle.parse(this.toJson());
    }

    static parse(json:any):ElementStyle {
        const newOne = new ElementStyle();
        newOne.condition = json.condition;
        newOne.style = json.style;
        return newOne;
    }
}

export enum ElementPropertyType {
    String = 'string',
    Number = 'number',
    Bool = 'bool',
    Enum = 'enum',
    Func = 'func'
}

export class ElementProperty {
    type: ElementPropertyType;
    name: string;
    value: any;
    default: any;
    isActive:boolean = false;
    isVariable:boolean = false;
    select = [];
    constructor(type:ElementPropertyType, name:string, value:string) {
        this.type = type;
        this.name = name;
        this.default = value;
        this.value  = value;
    }

    static parse(json:any) {
        const one = new ElementProperty(json.type, json.name, json.default);
        if (json.value) one.value = json.value;
        if (json.isActive) one.isActive = json.isActive;
        if (json.isVariable) one.isVariable = json.isVariable;
        if (json.select) one.select = json.select;
        if (one.value === undefined) one.value = ''; 
        return one;
    }

    toJson() {
        return {
            type: this.type,
            name: this.name,
            value: this.value,
            default: this.default,
            isActive: this.isActive,
            isVariable: this.isVariable,
            select: Utils.deepcopy(this.select)
        }
    }

    toVal() {
        return '""'
    }
}

export class Element {

    id?:number;
    name:string;
    library:LibraryKeys|undefined;
    code:string|undefined;
    style:Array<ElementStyle> = [new ElementStyle()];
    property:Array<ElementProperty> = [
        new ElementProperty(ElementPropertyType.String, 'name', ''),
        new ElementProperty(ElementPropertyType.String, 'class', '')
    ];
    collapse:boolean = true;
    children:Array<Element> = [];
    
    constructor(
        name:string,
        library:LibraryKeys|undefined = undefined,
        code:string|undefined = undefined,
        loop:boolean = true) {
            this.name = name;
            this.library = library;
            this.code = code;
            if (loop) {
                this.property.push(new ElementProperty(ElementPropertyType.String, 'for', ''));
            }
    }

    prop(key:string):ElementProperty|undefined {
        let property = undefined;
        this.property.filter((item:ElementProperty)=>item.name === key).forEach((item:ElementProperty)=> {
            property = item;
        });
        return property;
    }

    getCode():string {
        if (this.code) return this.code;
        return '';
    }

    getLib() {
        return this.library ? Library[this.library] : undefined
    }

    clone():Element {
        return Element.parse(this.toJson());
    }

    toJson():any {
        return {
            id:this.id,
            name:this.name,
            library: this.library,
            code: this.code,
            style: this.style.map((item:ElementStyle)=>item.toJson()),
            property: this.property.map((item:ElementProperty)=>item.toJson()),
            collapse: this.collapse,
            children: this.children.map((item:Element)=> item.toJson())
        }
    }

    static parse(json:any):Element {
        const newOne = new Element(json.name, 
            json.library,
            json.code)
        newOne.id = json.id;
        newOne.style = json.style.map((item:any)=>ElementStyle.parse(item));
        newOne.property = json.property.map((item:any)=>ElementProperty.parse(item));
        newOne.collapse = json.collapse;
        newOne.children = json.children.map((elemJson:any)=>Element.parse(elemJson)); 
        return newOne
    }

    static getReactRootElement():Element {
        const item = new Element('layout', undefined, '<div style={{style}}>{children}</div>', false);
        item.id = 0;
        return item;
    }

    static getReactNativeRootElement():Element {
        const item = new Element('View', new Library(LibraryKeys.ReactNative), '<reactNative.View style={{style}}>{children}</reactNative.View>', false);
        item.id = 0;
        return item;
    }

    // static define(tag:string, lib:Library|undefined, attr:Array<string>, option:any={}):Element {
    //     const libs = [];
    //     if (lib) libs.push(lib);
    //     attr.push('name');
    //     let attribute = ' ';
    //     let bodyText = '';
    //     let tagName = lib ? lib.key + '.' + tag : tag;
    //     attr.forEach((item:string)=> {
    //         attribute += item + '={{'+ item + '}} ';
    //     })
    //     if (option.onChange) attribute +=  'onChange={this.handleChange} ';
    //     if (option.onChangeText) attribute += 'onChangeText={(text)=>this.handleChange({target:{value:text, name:{name}}})} ';
    //     if (option.onValueChange) attribute += 'onValueChange={(val,idx)=>this.handleChange({target:{value:val, index:idx, name:{name}}})} ';
    //     if (option.onClick) attribute += 'onClick={this.handleClick} ';
    //     if (option.onPress) attribute += 'onPress={()=>this.handleClick({target:{name:{name}}})} ';
    //     if (option.source) {
    //         attribute += 'source={{uri: {src}}}'
    //         attr.push('src');
    //     }
    //     if (option.text) {
    //         bodyText += '{{text}}';
    //         attr.push('text');
    //     }
    //     if (option.nest) {
    //         const nestTag = lib ? lib.key + '.' + option.nest : option.nest;
    //         bodyText += '<'+ nestTag + '>{children}</'+nestTag+'>'; 
    //     } else {
    //         bodyText += '{children}'
    //     }

    //     let code = '<'+tagName+ ' style={{style}} ' + attribute + '>' + bodyText + '</'+tagName+'>'

    //     return new Element(tag, libs, code).addProps(attr);
    // }

    static parseApi(json:any, lib:LibraryKeys|undefined=undefined) {
        const elem = new Element(json.name, lib);
        Object.keys(json.prop).forEach((item:any)=> {   
            if (elem.prop(item) === undefined) {
                const newOne = new ElementProperty(json.prop[item].type, item, json.prop[item].default);
                if (json.prop[item].select) newOne.select = json.prop[item].select;
                elem.property.push(newOne);
            }
        });
        return elem;
    }
} 