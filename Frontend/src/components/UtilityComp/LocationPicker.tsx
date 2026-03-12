import { Modal, TextInput, Button, Group, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useState, useRef, useEffect } from 'react';
import { IconGps } from '@tabler/icons-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet's default marker issue with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const LocationPicker = ({ label, placeholder, form, id, required }: any) => {
    const [opened, { open, close }] = useDisclosure(false);
    const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
    const [confirmedPosition, setConfirmedPosition] = useState<[number, number] | null>(null);
    const [mapZoom, setMapZoom] = useState<number>(5);
    const mapRef = useRef<any>(null);


    useEffect(() => {
        if (form.values[id] && form.values[id].length === 2) {
            const latLng: [number, number] = form.values[id];

            setConfirmedPosition([Number(latLng[0]), Number(latLng[1])]);
            setSelectedPosition(latLng);
            setMapZoom(13);
        }
    }, [form.values[id]]);

    const LocationMarker = () => {
        const map = useMap();
        mapRef.current = map;

        useMapEvents({
            click(e) {
                const latLng: [number, number] = [e.latlng.lat, e.latlng.lng];
                setSelectedPosition(latLng);
            },
            zoomend() {
                setMapZoom(map.getZoom());
            },
        });

        return selectedPosition ? <Marker position={selectedPosition} /> : null;
    };

    const handleConfirm = () => {
        setConfirmedPosition(selectedPosition);
        form.setFieldValue(id, selectedPosition);
        close();
    };

    const goToCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    const latLng: [number, number] = [latitude, longitude];
                    setSelectedPosition(latLng);
                    setMapZoom(13);
                    mapRef.current?.setView(latLng, 13);
                },
                () => {
                    alert('Unable to retrieve your location');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser');
        }
    };

    return (
        <>
            <TextInput
                label={label}
                {...form.getInputProps(id)}
                value={
                    confirmedPosition
                        ? `${confirmedPosition[0].toFixed(4)}, ${confirmedPosition[1].toFixed(4)}`
                        : ''
                }

                placeholder={placeholder}
                onClick={open}
                required={required}
                readOnly
            />

            <Modal
                opened={opened}
                onClose={close}
                title="Select a Location"
                size="70%"
                closeOnClickOutside={false}
                closeOnEscape={false}

                centered
            >
                <div className="relative">
                    <MapContainer
                        center={selectedPosition ?? [20.5937, 78.9629]}
                        zoom={mapZoom}
                        style={{ height: '600px', width: '100%' }}

                        whenReady={() => {
                            mapRef.current = mapRef.current || null;
                        }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker />
                    </MapContainer>

                    <ActionIcon
                        color="blue"
                        variant="filled"
                        onClick={goToCurrentLocation}
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 1000,
                        }}
                    >
                        <IconGps size={20} />
                    </ActionIcon>
                </div>

                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={close}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedPosition}>
                        Confirm
                    </Button>
                </Group>
            </Modal>
        </>
    );
};

export default LocationPicker;