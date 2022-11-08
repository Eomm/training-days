import { Component } from "react";
import { useParams } from "react-router-dom";

import Carousel from "./Carousel";
import ThemeContext from "./ThemeContext";
import ErrorBoundary from "./ErrorBoundaries";
import Modal from "./Modal";

// Old style: Class component
class Details extends Component {
  constructor(props) {
    super(props);

    this.state = { loading: true };
  }

  toggleModal = () => this.setState({ showModal: !this.state.showModal });

  // like useEffect(fun, [])
  async componentDidMount() {
    const res = await fetch(
      `http://pets-v2.dev-apis.com/pets?id=${this.props.params.id}`
    );
    const json = await res.json();

    // it causes a re-render
    this.setState({
      loading: false,
      ...json.pets[0],
    });
  }

  render() {
    if (this.state.loading) {
      return <h2>Loading...</h2>;
    }

    if (this.props.params.id === "2") {
      throw new Error("Error boundary test");
    }

    const { animal, breed, city, state, description, name, images, showModal } =
      this.state;

    return (
      <div className="details">
        <Carousel images={images} />
        <div>
          <h1>{name}</h1>
          <h2>{`${animal} — ${breed} — ${city}, ${state}`}</h2>
          <ThemeContext.Consumer>
            {([theme]) => (
              <button
                onClick={this.toggleModal}
                style={{ backgroundColor: theme }}
              >
                Adopt {name}
              </button>
            )}
          </ThemeContext.Consumer>
          <p>{description}</p>
          {showModal ? (
            <Modal>
              <div>
                <h1>Would you like to adopt {name}?</h1>
                <div className="buttons">
                  <button onClick={this.toggleModal}>Yes</button>
                  <button onClick={this.toggleModal}>No</button>
                </div>
              </div>
            </Modal>
          ) : null}
        </div>
        {/* <div>
          <img src={images[0]} alt={name} />
        </div> */}
      </div>
    );
  }
}

// withRouter explained:
// export default withRouter(Details);
const WrappedDetails = () => {
  const params = useParams();

  // easy way:
  // const [theme] = useContext(ThemeContext);
  return (
    <ErrorBoundary>
      <Details params={params} />
    </ErrorBoundary>
  );
};
export default WrappedDetails;
