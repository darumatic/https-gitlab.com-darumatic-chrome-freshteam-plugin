import React from "react";
import ReactDOM from "react-dom";
import scriptService from "./script-service";


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      userInfo: {},
      query: {
        limit: 30,
        page: 1
      },
      text: "",
      scripts: [],
      selectedScript: {
        options: []
      },
      options: {}
    };
  }

  componentDidMount() {
    scriptService.textIndex((textIndex) => {
      this.setState({ text: this.state.textOptions[textIndex % this.state.textOptions.length] });
    });
    scriptService.getOptions((options) => {
      this.setState({ options }, () => {
        scriptService.getUserInfo(userInfo => {
          var query = { active: true, currentWindow: true };
          chrome.tabs.query(query, tabs => {
            var tab = tabs[0];
            if (tab) {
              var url = tab.url;
              this.setState({
                userInfo: userInfo,
                query: { url: url, loginToken: userInfo.token },
                isHttpPage: this.isHttpPage(url),
                url: url,
                host: this.host(url)
              }, () => {
                this.loadScripts();

                chrome.runtime.sendMessage(
                  {
                    type: "LOADED",
                    options: {}
                  },
                  function(response) {
                  }
                );
              });
            }
          });
        });
      });
    });
  }

  nextText() {
    let textIndex = (parseInt(this.state.textIndent + 1) % 2);
    this.setState({ textIndex });
  }

  loadScripts() {
    this.setState({ loading: true });
    scriptService.loadScripts(this.state.query, scripts => {
      console.log(scripts);
      this.sortScripts(scripts, (scripts) => {
        this.setState({ scripts, loading: false });
      });
    });
  }

  sortScripts(scripts, callback) {
    scriptService.getHistory((history) => {
      for (let i = 0; i < scripts.length; i++) {
        let script = scripts[i];
        script.rankingScore = scripts.length - i;
        for (let j = history.length - 1; j >= 0; j--) {
          if (script.scriptId === history[j].scriptId) {
            script.rankingScore += j * 100;
            break;
          }
        }
      }
      scripts.sort((a, b) => {
        return b.rankingScore - a.rankingScore;
      });
      callback(scripts);
    });
  }

  isHttpPage(url) {
    return url.startsWith("https://") || url.startsWith("http://");
  }

  host(url) {
    url = url.replace(/(https?:\/\/)?(www.)?/i, "");

    if (url.indexOf("/") !== -1) {
      return url.split("/")[0];
    }
    return url;
  }

  linkClicked(e) {
    var href = e.target.getAttribute("href");
    if (href) {
      chrome.tabs.create({ url: href });
    }
  }

  run(script) {
    if (script.options && script.options.length > 0) {
      if (this.state.selectedScript.scriptId === script.scriptId) {
        this.setState({ selectedScript: { options: [] } });
      } else {
        this.setState({ selectedScript: script });
      }
    } else {
      this.doRun(script, {});
    }
  }

  doRun(script, option) {
    chrome.tabs.query({ active: true, windowType: "normal", currentWindow: true }, (d) => {
      chrome.runtime.sendMessage(
        {
          type: "SCRIPT_RUN",
          options: {
            id: script.id,
            tabId: d[0].id,
            name: script.name,
            url: this.state.url,
            option: option
          }
        },
        function(response) {
        }
      );
    });
  }

  renderContent() {
    const { loading, scripts } = this.state;
    if (loading) {
      return <div className="scripts-loading">Loading...</div>;
    }
    if (!scripts || scripts.length === 0) {
      return <div className="scripts-empty">There is no scripts</div>;
    }
    return (
      <div className="media-list">
        {this.state.scripts.map(item => {
          return (
            <div className="media-container">
              <div className="media" onClick={() => this.run(item)} key={item.scriptId}>
                <div className="media-left">
                  <div className="script-logo">
                    {item.imageURL ? (
                      <img src={item.imageURL} className="script-image" />
                    ) : <div className="script-logo-text">{item.name.charAt(0)}</div>}
                    {/*{*/}
                    {/*  item.scriptVerified &&*/}
                    {/*  <img src="safe.png" className="script-verified"/>*/}
                    {/*}*/}
                  </div>
                </div>
                <div className="media-body">
                  <h4 className="media-heading">
                    {item.name}
                    {
                      item.status === "DRAFT" &&
                      <span>&nbsp;(Private)</span>
                    }
                  </h4>
                  <p>{item.description}</p>
                </div>
                {item.options &&
                item.options.length > 0 &&
                <div className="media-right">
                  <div className="script-option-menu">
                    {this.state.selectedScript.scriptId === item.scriptId ? <img className="script-option-menu-icon" src="menu--active.png" /> :
                      <img className="script-option-menu-icon" src="menu.png" />}
                  </div>
                </div>
                }
              </div>
              <ul className="list-group" style={{ height: this.state.selectedScript.scriptId === item.scriptId ? (45 * this.state.selectedScript.options.length + "px") : 0 }}>
                {this.state.selectedScript.scriptId === item.scriptId &&
                this.state.selectedScript.options.map(option => {
                  return <li className="list-group-item">
                    <a href="#" onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      this.doRun(this.state.selectedScript, option);
                    }}>{option.label}</a>

                  </li>;
                })
                }
              </ul>
            </div>
          );
        })}
        {/* <div className="media-more">
            <a href="javascript:void(0)" className="media-more-link">Check more Serviceclicked</a>
          </div> */}
      </div>
    );
  }

  render() {
    return (
      <div className="panel">
        <div className="panel-heading">
          <h3 className="title">Darumatic HR <span className="subtitle">Found {this.state.scripts.length || "0"} scripts</span>
          </h3>
        </div>
        <div className="panel-body">
          {/* <SearchInput /> */}
          {this.renderContent()}
        </div>
      </div>
    );

  }
}

const SearchInput = ({ value, onChange }) => {
  const focus = false;
  // const [focus, setFocus] = useState(false);

  // const focused = ()=> {setFocus(true)};
  // const blurred = ()=> {setFocus(false)};

  return (
    <div className={"search-container" + (focus ? " search-container--searching" : "")}>
      <div className="search-icon"><img src="search.png" /></div>
      <input className="search-input"
        //  onFocus={focused} onBlur={blurred}
        //  value={value} onChange={onChange}
        placeholder="search..." />
    </div>
  );
};

ReactDOM.render(
  <App />
  , document.getElementById("app"));
