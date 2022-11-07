import { Component } from "react";
import { useParams } from "react-router-dom";

import Carousel from "./Carousel";

import ErrorBoundary from "./ErrorBoundaries";

// Old style: Class component
class Details extends Component {
  constructor(props) {
    super(props);

    this.state = { loading: true };
  }

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

    if (this.props.params.id === '2') {
      throw new Error("Error boundary test");
    }

    const { animal, breed, city, state, description, name, images } =
      this.state;

    return (
      <div className="details">
        <Carousel images={images} />
        <div>
          <h1>{name}</h1>
          <h2>{`${animal} — ${breed} — ${city}, ${state}`}</h2>
          <button>Adopt {name}</button>
          <p>{description}</p>
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
  return (
    <ErrorBoundary>
      <Details params={params} />
    </ErrorBoundary>
  );
};
export default WrappedDetails;
