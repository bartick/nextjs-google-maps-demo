"use client";

import React from "react";
import Image from "next/image";
import {
  useJsApiLoader,
  Libraries,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api'

export default function Home() {

  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const [originString, setOriginString] = React.useState<(string | undefined | null)>(null);
  const [destinationString, setDestinationString] = React.useState<(string | undefined | null)>(null);
  const [waypointString, setWaypointString] = React.useState<(string | undefined | null)[]>([null]);

  const [origin, setOrigin] = React.useState<google.maps.LatLng | null>(null);
  const [destination, setDestination] = React.useState<google.maps.LatLng | null>(null);
  const [waypoints, setWaypoints] = React.useState<(google.maps.LatLng | null)[]>([null]);

  const [directions, setDirections] = React.useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = React.useState<string | undefined>(undefined);
  const [duration, setDuration] = React.useState<string | undefined>(undefined);
  const [originSearchResult, setoriginSearchResult] = React.useState<google.maps.places.Autocomplete | null>(null);
  const [destinationSearchResult, setDestinationSearchResult] = React.useState<google.maps.places.Autocomplete | null>(null);
  const [waypointSearchResult, setWaypointSearchResult] = React.useState<(google.maps.places.Autocomplete | null)[]>([null]);

  const libraries: Libraries = ['places'];

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_MAPS_API_KEY || "",
    libraries: libraries,
  });

  const center = {
    lat: 28.6862738,
    lng: 77.2217831,
  };

  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    const bounds = new window.google.maps.LatLngBounds(center);
    map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  function notEmpty<LatLng>(value: LatLng | null): value is LatLng {
    return value !== null && value !== undefined;
  }

  async function CalculateDistance() {
    if(origin && destination) {
      const directionsService = new google.maps.DirectionsService();
      const waypointToCheck: google.maps.LatLng[] = waypoints.filter(notEmpty);
      try {
        const results = await directionsService.route({
          origin: origin,
          waypoints: waypointToCheck.map((waypoint) => ({
            location: waypoint,
            stopover: true,
          })),
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true,
  
        });

        setDirections(results);
        setDistance(results.routes[0].legs[0].distance?.text)
        setDuration(results.routes[0].legs[0].duration?.text)
      }
      catch (error) {
        alert("Error in calculating distance, Please choose valid locations");
      }
    }
  }

  return (
    <div className="bg-[#F4F8FA] flex items-stretch min-h-screen flex-col text-[#2E2E2E] max-h-screen">

        <nav className="bg-white h-20 w-full md:block hidden">
          <Image src="/next.svg" alt="gravity" className="ml-16" width={180} height={69} priority={false}/>
        </nav>

        <div className="hidden md:block">
          <div className="flex justify-center items-center h-6 mt-12 text-[#1B31A8]">
            <p>
              Let's calculate <b>distance</b> from google maps
            </p>
          </div>
        </div>

        {
          isLoaded ? (
            <div className="flex justify-center flex-col md:mt-10 md:flex-row-reverse md:space-x-reverse md:space-x-20 space-y-4 md:space-y-0">

          {/* Loading the map here */}
            <GoogleMap
              mapContainerClassName="w-full h-80 md:h-96 md:w-96 w-screen"
              onLoad={onLoad}
              onUnmount={onUnmount}
              center={center}
              zoom={13}
              options={{
                fullscreenControl: false,
                streetViewControl: false,
                mapTypeControl: false,
                zoomControl: false,
                scaleControl: false,
                rotateControl: false,
              }}
            >

              {directions && <DirectionsRenderer directions={directions} options={{
                suppressMarkers: true,
              }} />}

              {
                (origin && directions) && (
                  <Marker
                    position={origin}
                    icon='/origin.svg'
                  />
                )
              }

              {(waypoints.length > 0 && directions) && waypoints.map((waypoint, index) => (
                waypoint && (
                  <Marker
                    key={index}
                    position={waypoint}
                    icon='/marker.svg'
                  />
                )
              ))}

              {(destination && directions) && (
                <Marker
                  position={destination}
                  icon='/destination.svg'
                />
              )}
            </GoogleMap>

          <div className="flex flex-col justify-center items-center space-y-14 mb-3">
            <div className="flex md:space-x-16 justify-center flex-col md:flex-row md:space-y-0 space-y-5">
              <div className="flex flex-col justify-center md:justify-start space-y-5">
                <div className="flex flex-col justify-center space-y-5">
                  <div className="w-[90vw] md:w-80">
                    <label htmlFor="origin" className="md:block mb-1 text-sm font-medium hidden">Origin</label>
                        <div className="flex bg-white rounded-lg">
                          <div className="flex justify-center bg-white p-3 rounded-lg">
                            <Image src="/origin.svg" alt="destination" width={15} height={15}/>
                          </div>
                          <Autocomplete
                            onLoad={(autocomplete) => {
                              setoriginSearchResult(autocomplete);
                            }}
                            onPlaceChanged={() => {
                              if (originSearchResult != null) {
                                const place = originSearchResult.getPlace();
                                const geometry = place.geometry;

                                setOriginString(place.formatted_address);

                                if (geometry?.location) {
                                  setOrigin(geometry.location);
                                }

                              } else {
                                alert("Please enter text");
                              }
                            }}
                            options={{
                              fields: ['formatted_address', 'geometry', 'name'],
                              types: ['(cities)'],
                            }}
                          >
                            <input type="text" id="origin" className="h-11 w-64 rounded-lg outline-none" placeholder="Select Origin" required />
                          </Autocomplete>
                        </div>
                  </div>


                  <div className="flex flex-col">
                    <div id="waypoint" className="space-y-2">
                      {
                        Array.from(waypoints.keys()).map((key) => (
                          <div key={key} className="w-[90vw] md:w-80">
                            <label htmlFor="waypoint" className="hidden md:block mb-1 text-sm font-medium">Waypoint {key+1}</label>
                              <div className="flex bg-white rounded-lg">
                                <div className="flex justify-center bg-white p-3 rounded-lg">
                                  <Image src="/marker.svg" alt="waypoint" width={15} height={15}/>
                                  </div>
                                  <Autocomplete
                                    onLoad={(autocomplete) => {
                                      let temp = waypointSearchResult;
                                      temp[key] = autocomplete;
                                      setWaypointSearchResult(temp);
                                    }}
                                    onPlaceChanged={() => {
                                      if (waypointSearchResult[key] != null) {
                                        const place = waypointSearchResult[key]?.getPlace();
                                        const geometry = place?.geometry;

                                        
                                        let tempString = waypointString;
                                        tempString[key] = place?.formatted_address;
                                        setWaypointString(tempString);

                                        if (geometry?.location) {
                                          let temp = waypoints;
                                          temp[key] = geometry.location;
                                          setWaypoints(temp);
                                        }

                                      } else {
                                        alert("Please enter text");
                                      }
                                    }}
                                    options={{
                                      fields: ['formatted_address', 'geometry', 'name'],
                                      types: ['(cities)'],
                                    }}
                                  >
                                    <input type="text" id={"waypoint-"+key} className="h-11 w-64 rounded-lg outline-none" placeholder="Select Waypoint" />
                                  </Autocomplete>
                                </div>
                          </div>
                        ))
                      }
                    </div>
                    <div className="flex justify-end text-sm font-light mr-1 space-x-1 items-center" onClick={() => setWaypoints([...waypoints, null])}>
                      <Image src="/add.svg" alt="add" width={15} height={15}></Image>
                      <p>Add Another Stop</p>
                    </div>
                  </div>


                  <div className="w-[90vw] md:w-80">
                    <label htmlFor="destination" className="hidden md:block mb-1 text-sm font-medium">Destination</label>
                        <div className="flex bg-white rounded-lg">
                          <div className="flex justify-center bg-white p-3 rounded-lg">
                            <Image src="/destination.svg" alt="destination" width={15} height={15}/>
                          </div>
                          <Autocomplete
                            onLoad={(autocomplete) => {
                              setDestinationSearchResult(autocomplete);
                            }}
                            onPlaceChanged={() => {
                              if (destinationSearchResult != null) {
                                const place = destinationSearchResult.getPlace();
                                const geometry = place.geometry;

                                setDestinationString(place.formatted_address);

                                if (geometry?.location) {
                                  setDestination(geometry.location);
                                }

                              } else {
                                alert("Please enter text");
                              }
                            }}
                            options={{
                              fields: ['formatted_address', 'geometry', 'name'],
                              types: ['(cities)'],
                            }}
                          >
                            <input type="destination" id="origin" className="h-11 w-64 rounded-lg outline-none" placeholder="Select Destination" required />
                          </Autocomplete>
                        </div>
                  </div>
                </div>

                
              </div>
              <div className="flex flex-col justify-center">
                <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-3xl text-sm md:px-9 px-5 py-2.5 me-2 mb-2 mr-28 ml-28 md:ml-0 md:mr-0 " onClick={CalculateDistance}>Calculate</button>
              </div>
            </div>
            <div className="border-2 md:w-[41rem] w-[30rem] rounded-lg">
              <div className="flex justify-center bg-white h-20">
                <div className="flex justify-between items-center h-20 w-96 text-2xl">
                  <p className="">Distance</p>
                  <p className="text-[#0079FF] font-semibold">{distance??"0 km"}</p>
                </div>
              </div>
              {
                distance && (
                  <div className="flex justify-center items-center h-20">
                    <a className="text-sm ml-3 mr-3 break-word">
                      The distance between the <b>{originString}</b> and <b>{destinationString}</b> via {
                        waypointString.map((waypoint, index) => (
                          waypoint && (
                            <b key={index}>{waypoint}, </b>
                          )
                        ))
                      } is <b><u>{distance}</u></b> and the time taken to travel is {duration}
                    </a>
                  </div>
                )
              }
            </div>
          </div>
        </div>
        ) : (
          <div>Loading...</div>
        )
        }
    </div>
  );
}

