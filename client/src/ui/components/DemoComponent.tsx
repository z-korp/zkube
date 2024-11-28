import { Component } from "react";
import Flicking from "@egjs/react-flicking";
import { Perspective } from "@egjs/flicking-plugins";

export default class DemoComponent extends Component {
  private _plugins = [new Perspective({ rotate: 0.5 })];

  public render() {
    return (
      <Flicking circular={true} plugins={this._plugins}>
        <div className="card-panel">1</div>
        <div className="card-panel">2</div>
        <div className="card-panel">3</div>
        <div className="card-panel">4</div>
        <div className="card-panel">5</div>
        <div className="card-panel">6</div>
      </Flicking>
    );
  }
}
