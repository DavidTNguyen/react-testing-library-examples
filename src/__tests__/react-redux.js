import React from 'react'
import {createStore} from 'redux'
import {Provider, connect} from 'react-redux'
import {render, fireEvent} from '@testing-library/react'

// counter.js
class Counter extends React.Component {
  increment = () => {
    this.props.dispatch({type: 'INCREMENT'})
  }

  decrement = () => {
    this.props.dispatch({type: 'DECREMENT'})
  }

  render() {
    return (
      <div>
        <h2>Counter</h2>
        <div>
          <button onClick={this.decrement}>-</button>
          <span data-testid="count-value">{this.props.count}</span>
          <button onClick={this.increment}>+</button>
        </div>
      </div>
    )
  }
}

// normally this would be:
// export default connect(state => ({count: state.count}))(Counter)
// but for this test we'll give it a variable name
// because we're doing this all in one file
const mapStateToProps = state => ({
  count: state.count,
})
const ConnectedCounter = connect(mapStateToProps)(Counter)
// const ConnectedCounter = connect(state => ({count: state.count}))(Counter)

// app.js
function reducer(state = {count: 0}, action) {
  switch (action.type) {
    case 'INCREMENT':
      return {
        count: state.count + 1,
      }
    case 'DECREMENT':
      return {
        count: state.count - 1,
      }
    default:
      return state
  }
}

// normally here you'd do:
// const store = createStore(reducer)
// ReactDOM.render(
//   <Provider store={store}>
//     <Counter />
//   </Provider>,
//   document.getElementById('root'),
// )
// but for this test we'll umm... not do that :)

// Now here's what your test will look like:

// this is a handy function that I normally make available for all my tests
// that deal with connected components.
// you can provide initialState or the entire store that the ui is rendered with
// You may have noticed that in the "after" function declaration there's an = {} after the second parameter (which is destructured). 
// What is this doing? We're setting the "default" value for the second parameter to be an empty object. 
// Why are we doing it? If nothing is passed in as the second parameter, the value of it would be undefined. Now normally this isn't a problem, except that we're attempting to destructure variables from the second parameter, and you obviously can't destructure anything from undefined.
function renderWithRedux(
  ui,
  {initialState, store = createStore(reducer, initialState)} = {},
) {
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    // adding `store` to the returned utilities to allow us
    // to reference it in our tests (just try to avoid using
    // this to test implementation details).
    store,
  }
}

test('can render with redux with defaults', () => {
  const {getByTestId, getByText} = renderWithRedux(<ConnectedCounter />)
  fireEvent.click(getByText('+'))
  expect(getByTestId('count-value')).toHaveTextContent('1')
})

test('can render with redux with custom initial state', () => {
  const {getByTestId, getByText} = renderWithRedux(<ConnectedCounter />, {
    initialState: {count: 3},
  })
  fireEvent.click(getByText('-'))
  expect(getByTestId('count-value')).toHaveTextContent('2')
})

test('can render with redux with custom store', () => {
  // this is a silly store that can never be changed
  const store = createStore(() => ({count: 1000}))
  const {getByTestId, getByText} = renderWithRedux(<ConnectedCounter />, {
    store,
  })
  fireEvent.click(getByText('+'))
  expect(getByTestId('count-value')).toHaveTextContent('1000')
  fireEvent.click(getByText('-'))
  expect(getByTestId('count-value')).toHaveTextContent('1000')
})
