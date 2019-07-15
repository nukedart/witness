import React, { Component } from 'react';
import './static/App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <Menu>
          <Container>
            <Menu.Item as="a" header>
              <Image
                  size="small"
                  src="https://www.robinwieruch.de/img/page/logo.svg"
              />
            </Menu.Item>

            <Menu.Menu position="right">
              <Menu.Item as="a" name="login">
                Login
              </Menu.Item>

              <Menu.Item as="a" name="register">
                Register
              </Menu.Item>
            </Menu.Menu>
          </Container>
        </Menu>
      </div>
    );
  }
}

export default App;
