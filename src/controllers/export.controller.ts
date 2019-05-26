
import { Controller } from './controller';
import { File, FileType } from '../models/file';
import Utils from '../utils/utils';
import { Element } from '../models/element';
declare var window:any;

export class ExportController extends Controller {

    private static TEMPLATE_CLASS = "export class {classname} extends DesignedComponent {\n\t{state}\n\trender() {\n\t\t// @ts-ignore\n\t\treturn {code}\n\t}\n}\n";
    private static TEMPLATE_IMPORT = "import React from 'react';\n{import}\n";
    private static TEMPLATE_ABSTRACT = "class DesignedComponent extends React.Component<any, any> {{component_func}\n\trenderPart = (name:any) => {}\n}\n";
    private static TEMPLATE_FUNC_EVENT = "\n\tonEvent = (e:any) => {\n\t\tif (e.event === 'onMouseEnter') {\n\t\t\tthis.setState({hover:e.name});\n\t\t} else if (e.event === 'onMouseLeave') {\n\t\t\tthis.setState({hover:undefined});\n\t\t}\n\t};";
    private static TEMPLATE_FUNC_SYNC = "\n\tsync = (key:any, value:any) => {\n\t\tif (this.state[key] !== value) {\n\t\t\tthis.setState({[key]:value});\n\t\t}\n\t}";
    private cachePath:string|undefined;

    export(root:File, rsc:Array<object>, useCache:boolean) {
        const js = this.makeReactJs(root);
        const json = {
            root: root.toJson(),
            resource: JSON.stringify(rsc),
            platform: this.main.getPlatform(),
        }
        try {
            const { remote } = window.require('electron')
            const fs = window.require('fs')
            if (!this.cachePath || !useCache) {
                this.cachePath = remote.dialog.showOpenDialog({ properties: ['openDirectory'] })[0];
            }
            
            fs.writeFile(this.cachePath+'/designData.json', JSON.stringify(json), (err:any)=> {
                if (err) {
                    return console.log(err)
                }
                console.log('saved json')
                document.getElementsByTagName('title')[0].innerText = 'Service Designer';
            });
            fs.writeFile(this.cachePath+'/design.tsx', js, (err:any)=> {
                if (err) {
                    return console.log(err)
                }
                console.log('saved tsx')
            });
            document.getElementsByTagName('title')[0].innerText = 'Service Designer';
        } catch(e) {
            console.log('not electron platfrom');
            console.log(js, json);
            return;
        }
    }

    setCachePath(path:string) {
        this.cachePath = path;
    }

    private makeReactJs(root:File) {
        let js = '';
        let impjs = '';
        const classes:Array<string> = [];
        const imp:{[s:string]: string;} = {};
        Utils.loop(root, (file:File, stack:Array<File>)=> {
            if (file.type === FileType.FILE) {
                Utils.loop(file.element, (elem:Element)=> {
                    if (elem.library) { 
                        imp[elem.library] = elem.getLib().name;
                    }
                });

                let className = 'Designed';
                stack.forEach((st:File)=> {
                    if (st.type !== FileType.ROOT)
                        className += Utils.toCapital(st.name);
                });
                className += Utils.toCapital(file.name.replace('.js', ''));
                const data = this.main.getRenderData(file, false);
                let classJs = ExportController.TEMPLATE_CLASS.replace('{code}', data.code);
                classJs = classJs.replace('{classname}', className);
                classJs = classJs.replace('{state}', 'state='+JSON.stringify(data.state));
                classes.push(classJs);
            } 
        });

        Object.keys(imp).forEach((key:any)=> {
            impjs += 'import * as ' + key + ' from \'' + imp[key] + '\';\n';
        });

        const func = ExportController.TEMPLATE_FUNC_EVENT + ExportController.TEMPLATE_FUNC_SYNC;
        js = ExportController.TEMPLATE_IMPORT.replace('{import}', impjs);
        js += '\n'+ExportController.TEMPLATE_ABSTRACT.replace('{component_func}', func);

        classes.forEach((com:string)=> js += '\n' + com);
        return js;
    }
}