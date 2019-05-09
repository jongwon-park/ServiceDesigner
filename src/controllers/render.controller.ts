
import { Controller } from './controller';
import { File } from '../models/file';
import React from 'react';
import { Element } from './../models/element';
import { LibraryTable } from './library/librarytable';
import Utils from './../utils/utils';
import { ResourceType, Resource } from '../models/resource';
import { Platform } from '../utils/constant';

export class RenderController extends Controller {

    private cssCache = {};

    render(file:File, selection=true) {
        if (!file || !file.element) throw 'no element';
        const imp:any = {React};
        const code = this.parse(file.element, imp, file.state, selection);
        console.log(file.state, imp, code);
        return {
            state: file.state,
            imp: imp,
            code: code
        }
    }

    private parse(elem:Element, imp:any, state:any, selection=true) {
        this.parseLibrary(elem, imp)

        let code = elem.code;
        let children = '';
        elem.children.forEach((child:Element)=> {
            children += this.parse(child, imp, state, selection);
        });
        let styles = {};
        Object.keys(elem.property).forEach(prop=> {
            if (prop === 'class') {
                elem.property[prop].split(' ').forEach((cls:string)=> {
                    const rsc = this.main.getResource(ResourceType.CSS, cls);
                    if (rsc && !Array.isArray(rsc)) {
                        styles = Utils.merge(styles, this.convertCssToStyle(rsc.value, cls.replace('-', '_')));
                    }
                })
            } else  {
                code = code.replace('{'+prop+'}', this.parseProperty(prop, elem.property[prop]));
            }
        });
        code = code.replace('{style}', this.parseStyle(elem, styles, selection));
        code = code.replace('{children}', children);
        code = this.parseIfAndForLoop(elem, code, state);
        return code;
    }

    private convertCssToStyle(css:string, key:string) {
        if (css === undefined) {
            return {}
        } 
        try {
            this.cssCache = Utils.transform(css)[key];
        } catch(e) {
            console.log(e, css);
        }
        return this.cssCache;
    }

    // private isValidIcon(elem:Element):boolean {
    //     if (!elem.library || elem.library.length == 0) {
    //         return true;
    //     }
    //     if(elem.library[0].dependency === LibraryDependency.ReactIcon) {
            
    //     } else if (elem.library[0].dependency === LibraryDependency.ReactNativeVectorIcon) {

    //     }
    // }

    private parseLibrary(elem:Element, imp:any) {
        if (elem.library) {
            elem.library.forEach(item=> {
                const service:any = LibraryTable[item.dependency];
                item.items.forEach(key=> {
                    imp[key] = service.get(key);
                });
            });
        }
    }

    private parseProperty(key:string, value:string):string {
        if (typeof(value) === 'object') {
            value = JSON.stringify(value);
        } else if (typeof(value) === 'string') {
            if (value === '{item}' || 
                (value.indexOf('{item.')===0 && value[value.length-1] === '}' && value !== '{item.}') ||
                (value.indexOf('{this.state.') === 0 && value[value.length-1] === '}' && value !== '{this.state.}')) {
                value = value.slice(1, value.length-1)
            } else if (value.indexOf('Asset.') === 0) {
                const temp = value;
                value = '""';
                const assets = this.main.getResource(ResourceType.ASSET);
                if (Array.isArray(assets)) {
                    assets.forEach((asset:Resource)=> {
                        if (temp === 'Asset.'+asset.name) {
                            value = '"'+asset.value + '"';
                        }
                    })
                }
            } else if (key === 'icon') {
            } else {
                value = '"' + String(value) + '"'
            }   
        }
        return value;
    }

    private parseStyle(elem:Element, origin={}, selection=true):string {
        let style:any = this.convertCssToStyle(Utils.deepcopy(elem.style), 'style');
        if (elem === this.main.getSelectedElement() && selection) {
            if (this.main.getPlatform() === Platform.React) {
                style.border = 'solid 1px red';
            } else if (this.main.getPlatform() === Platform.ReactNative) {
                style.borderColor = 'red';
                style.borderWidth = '1px';
            }
        }
        style = Utils.merge(origin, style);
        Object.keys(style).forEach(key=> {
            const colors = this.main.getResource(ResourceType.COLOR);
            if (Array.isArray(colors)) {
                colors.forEach((color:Resource)=> {
                    if (style[key] === '"Color.'+color.name+'"') {
                        style[key] = color.value;
                    }
                });
            }
            const assets = this.main.getResource(ResourceType.ASSET);
            if (Array.isArray(assets)) {
                assets.forEach((asset:Resource)=> {
                    if (style[key] === '"Asset.'+asset.name+'"') {
                        style[key] = 'url(' + asset.value + ')';
                    }
                })
            }
        })
        let stringStyle = JSON.stringify(style);
        return stringStyle;
    }

    private parseIfAndForLoop(elem:Element, code:string, state:any):string {
        let brace = false;
        if (elem.property['for'] && elem.property['for'] !== '' && Array.isArray(state[elem.property['for']])) {
            code = code.replace('>', 'key={i} >');
            code = 'this.state.' + elem.property['for'] + '.map((item, i)=> '+code+')';
            brace = true;
        }
        if (elem.property['if'] && elem.property['if'] !== '') {
            code = 'this.state.'+elem.property['if'] + ' && '+code;
            brace = true;
        }
        if (brace) {
            code = '{ ' + code + ' }';
        }
        return code;
    }
}