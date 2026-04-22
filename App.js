/**
 * IAC Vehicle Log
 * React Native app for tracking cars and driver submissions.
 *
 * @format
 */

import React, { Component } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  Button,
  Divider,
  Header,
  Text,
  Card,
  Input,
  Overlay,
  Icon,
  ListItem,
} from 'react-native-elements';

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cars: [],
      submissions: [],

      newCarTitle: '',
      newCarPlate: '',
      newCarVin: '',

      editOverlayVisible: false,
      editingCarId: null,
      editTitle: '',
      editPlate: '',
      editVin: '',

      submissionCarId: null,
      submissionDriverName: '',
      submissionNotes: '',
    };
  }

  addCar = () => {
    const title = this.state.newCarTitle.trim();
    if (!title) return;
    const car = {
      id: Date.now().toString(),
      title,
      licensePlate: this.state.newCarPlate.trim(),
      vin: this.state.newCarVin.trim(),
    };
    this.setState({
      cars: [...this.state.cars, car],
      newCarTitle: '',
      newCarPlate: '',
      newCarVin: '',
    });
  };

  openEditCar = (car) => {
    this.setState({
      editOverlayVisible: true,
      editingCarId: car.id,
      editTitle: car.title,
      editPlate: car.licensePlate,
      editVin: car.vin,
    });
  };

  saveEditCar = () => {
    const title = this.state.editTitle.trim();
    if (!title) return;
    const cars = this.state.cars.map((c) =>
      c.id === this.state.editingCarId
        ? {
            ...c,
            title,
            licensePlate: this.state.editPlate.trim(),
            vin: this.state.editVin.trim(),
          }
        : c,
    );
    this.setState({
      cars,
      editOverlayVisible: false,
      editingCarId: null,
    });
  };

  closeEdit = () => {
    this.setState({ editOverlayVisible: false, editingCarId: null });
  };

  addSubmission = () => {
    const { submissionCarId, submissionDriverName, submissionNotes } = this.state;
    const driver = submissionDriverName.trim();
    if (!submissionCarId || !driver) return;
    const entry = {
      id: Date.now().toString(),
      carId: submissionCarId,
      driverName: driver,
      notes: submissionNotes.trim(),
      timestamp: new Date().toISOString(),
    };
    this.setState({
      submissions: [entry, ...this.state.submissions],
      submissionCarId: null,
      submissionDriverName: '',
      submissionNotes: '',
    });
  };

  carTitle = (id) => {
    const car = this.state.cars.find((c) => c.id === id);
    return car ? car.title : 'Unknown car';
  };

  render() {
    const {
      cars,
      submissions,
      newCarTitle,
      newCarPlate,
      newCarVin,
      editOverlayVisible,
      editTitle,
      editPlate,
      editVin,
      submissionCarId,
      submissionDriverName,
      submissionNotes,
    } = this.state;

    return (
      <View style={styles.container}>
        <Header
          centerComponent={{
            text: 'IAC Vehicle Log',
            style: { color: 'white', fontSize: 18 },
          }}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <Text h4 style={styles.section}>Add a Car</Text>
          <Input
            placeholder="Car title (e.g. Silver Toyota)"
            value={newCarTitle}
            onChangeText={(v) => this.setState({ newCarTitle: v })}
          />
          <Input
            placeholder="License plate (optional — add later)"
            value={newCarPlate}
            onChangeText={(v) => this.setState({ newCarPlate: v })}
          />
          <Input
            placeholder="VIN (optional — add later)"
            value={newCarVin}
            onChangeText={(v) => this.setState({ newCarVin: v })}
          />
          <Button
            title="Add Car"
            onPress={this.addCar}
            disabled={!newCarTitle.trim()}
          />

          <Divider style={styles.divider} />
          <Text h4 style={styles.section}>Cars</Text>
          {cars.length === 0 && (
            <Text style={styles.empty}>No cars yet.</Text>
          )}
          {cars.map((car) => (
            <Card key={car.id}>
              <Card.Title>{car.title}</Card.Title>
              <Text>
                License plate: {car.licensePlate || '— not set —'}
              </Text>
              <Text>VIN: {car.vin || '— not set —'}</Text>
              <Divider style={{ marginVertical: 8 }} />
              <Button
                title="Edit"
                type="outline"
                onPress={() => this.openEditCar(car)}
              />
            </Card>
          ))}

          <Divider style={styles.divider} />
          <Text h4 style={styles.section}>New Submission</Text>
          {cars.length === 0 ? (
            <Text style={styles.empty}>Add a car first.</Text>
          ) : (
            <View>
              <Text style={styles.label}>Select car:</Text>
              {cars.map((car) => {
                const selected = submissionCarId === car.id;
                return (
                  <ListItem
                    key={car.id}
                    onPress={() =>
                      this.setState({ submissionCarId: car.id })
                    }
                    bottomDivider
                    containerStyle={selected ? styles.selected : null}
                  >
                    <ListItem.Content>
                      <ListItem.Title>{car.title}</ListItem.Title>
                    </ListItem.Content>
                    {selected && <Icon name="check" color="green" />}
                  </ListItem>
                );
              })}
              <Divider style={{ height: 10 }} />
              <Input
                placeholder="Your name (driver)"
                value={submissionDriverName}
                onChangeText={(v) =>
                  this.setState({ submissionDriverName: v })
                }
              />
              <Input
                placeholder="Notes / details"
                value={submissionNotes}
                onChangeText={(v) =>
                  this.setState({ submissionNotes: v })
                }
                multiline
              />
              <Button
                title="Submit"
                onPress={this.addSubmission}
                disabled={
                  !submissionCarId || !submissionDriverName.trim()
                }
              />
            </View>
          )}

          <Divider style={styles.divider} />
          <Text h4 style={styles.section}>All Submissions</Text>
          {submissions.length === 0 && (
            <Text style={styles.empty}>No submissions yet.</Text>
          )}
          {submissions.map((s) => (
            <Card key={s.id}>
              <Card.Title>{this.carTitle(s.carId)}</Card.Title>
              <Text>Driver: {s.driverName}</Text>
              <Text>When: {new Date(s.timestamp).toLocaleString()}</Text>
              {s.notes ? <Text>Notes: {s.notes}</Text> : null}
            </Card>
          ))}
          <Divider style={{ height: 40 }} />
        </ScrollView>

        <Overlay
          isVisible={editOverlayVisible}
          onBackdropPress={this.closeEdit}
          overlayStyle={styles.overlay}
        >
          <Text h4>Edit Car</Text>
          <Divider style={{ height: 10 }} />
          <Input
            placeholder="Car title"
            value={editTitle}
            onChangeText={(v) => this.setState({ editTitle: v })}
          />
          <Input
            placeholder="License plate"
            value={editPlate}
            onChangeText={(v) => this.setState({ editPlate: v })}
          />
          <Input
            placeholder="VIN"
            value={editVin}
            onChangeText={(v) => this.setState({ editVin: v })}
          />
          <Button
            title="Save"
            onPress={this.saveEditCar}
            disabled={!editTitle.trim()}
          />
          <Divider style={{ height: 10 }} />
          <Button title="Cancel" type="outline" onPress={this.closeEdit} />
        </Overlay>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 10,
  },
  section: {
    marginTop: 10,
    marginBottom: 10,
    color: '#333',
  },
  divider: {
    height: 20,
    backgroundColor: 'transparent',
  },
  empty: {
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 10,
  },
  label: {
    marginBottom: 6,
    color: '#555',
  },
  selected: {
    backgroundColor: '#e6f4ff',
  },
  overlay: {
    width: 320,
    padding: 20,
  },
});
