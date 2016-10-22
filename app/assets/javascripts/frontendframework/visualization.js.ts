/// <reference path="./mini_html_view_model.js.ts"/>
/// <reference path="../__d3.d.ts"/>

namespace FrontEndFramework {
    export namespace Visualization {
        export namespace Charting {
            export interface IChart {}

            export abstract class Chart implements IChart {
                constructor() {}
            }

            export class PieChart {
                constructor() {}
            }

            export class BarChart {
                constructor() {}
            }
        }
    }
}
