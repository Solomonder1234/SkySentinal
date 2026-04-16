import axios from 'axios';

export class AnimalService {
    public static async getAnimalImage(type: string): Promise<string | null> {
        try {
            switch (type.toLowerCase()) {
                case 'dog': {
                    const res = await axios.get('https://dog.ceo/api/breeds/image/random');
                    return res.data.message;
                }
                case 'cat': {
                    const res = await axios.get('https://api.thecatapi.com/v1/images/search');
                    return res.data[0].url;
                }
                case 'fox': {
                    const res = await axios.get('https://randomfox.ca/floof/');
                    return res.data.image;
                }
                case 'bird':
                case 'birb': {
                    const res = await axios.get('https://some-random-api.com/animal/birb');
                    return res.data.image;
                }
                case 'panda': {
                    const res = await axios.get('https://some-random-api.com/animal/panda');
                    return res.data.image;
                }
                case 'red_panda':
                case 'redpanda': {
                    const res = await axios.get('https://some-random-api.com/animal/red_panda');
                    return res.data.image;
                }
                case 'koala': {
                    const res = await axios.get('https://some-random-api.com/animal/koala');
                    return res.data.image;
                }
                case 'shiba':
                case 'shibainu': {
                    const res = await axios.get('https://shibe.online/api/shibes?count=1');
                    return res.data[0];
                }
                case 'duck': {
                    const res = await axios.get('https://random-d.uk/api/v2/random');
                    return res.data.url;
                }
                case 'raccoon': {
                    const res = await axios.get('https://some-random-api.com/animal/raccoon');
                    return res.data.image;
                }
                case 'kangaroo': {
                    const res = await axios.get('https://some-random-api.com/animal/kangaroo');
                    return res.data.image;
                }
                default:
                    return null;
            }
        } catch (error) {
            console.error(`[AnimalService] Error fetching ${type}:`, error);
            return null;
        }
    }
}
